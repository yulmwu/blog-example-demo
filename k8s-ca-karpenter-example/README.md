# CA

```shell
eksctl create cluster -f ca/cluster.yaml
aws eks update-kubeconfig --name ca-lab-eks
```

```shell
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  -f ca/ca-values.yaml
```

```shell
kubectl apply -f common/deployment.yaml
source ./common/measure-provisioning.sh
```

# Karpenter

```shell
eksctl create cluster -f karpenter/cluster.yaml
aws eks update-kubeconfig --name karpenter-lab-eks
```

```shell
CLUSTER_NAME=karpenter-lab-eks
AWS_REGION=ap-northeast-2
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

CLUSTER_ENDPOINT=$(aws eks describe-cluster \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --query "cluster.endpoint" \
  --output text)

OIDC_PROVIDER=$(aws eks describe-cluster \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --query "cluster.identity.oidc.issuer" \
  --output text | sed -e "s/^https:\/\///")

aws iam create-role \
  --role-name KarpenterControllerRole-$CLUSTER_NAME \
  --assume-role-policy-document \
  file://<(printf '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::%s:oidc-provider/%s"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "%s:sub": "system:serviceaccount:karpenter:karpenter",
          "%s:aud": "sts.amazonaws.com"
        }
      }
    }]
  }' "$ACCOUNT_ID" "$OIDC_PROVIDER" "$OIDC_PROVIDER" "$OIDC_PROVIDER")

cat <<EOF > karpenter/karpenter-controller-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EC2Permissions",
            "Effect": "Allow",
            "Action": [
                "ec2:RunInstances",
                "ec2:CreateLaunchTemplate",
                "ec2:DeleteLaunchTemplate",
                "ec2:CreateFleet",
                "ec2:TerminateInstances",
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceTypes",
                "ec2:DescribeInstanceTypeOfferings",
                "ec2:DescribeImages",
                "ec2:DescribeSubnets",
                "ec2:DescribeVpcs",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeLaunchTemplates",
                "ec2:DescribeLaunchTemplateVersions",
                "ec2:DescribeSpotPriceHistory",
                "ec2:CreateTags",
                "ec2:DeleteTags",
                "ec2:DescribeCapacityReservations"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IAMInstanceProfileManagement",
            "Effect": "Allow",
            "Action": [
                "iam:ListInstanceProfiles",
                "iam:CreateInstanceProfile",
                "iam:DeleteInstanceProfile",
                "iam:GetInstanceProfile",
                "iam:AddRoleToInstanceProfile",
                "iam:RemoveRoleFromInstanceProfile",
                "iam:TagInstanceProfile",
                "iam:TagRole"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IAMReadRoles",
            "Effect": "Allow",
            "Action": ["iam:GetRole", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies"],
            "Resource": "*"
        },
        {
            "Sid": "PassRole",
            "Effect": "Allow",
            "Action": ["iam:PassRole"],
            "Resource": "*"
        },
        {
            "Sid": "PricingRead",
            "Effect": "Allow",
            "Action": ["pricing:GetProducts"],
            "Resource": "*"
        },
        {
            "Sid": "EKSDescribe",
            "Effect": "Allow",
            "Action": ["eks:DescribeCluster"],
            "Resource": "arn:aws:eks:${AWS_REGION}:${ACCOUNT_ID}:cluster/${CLUSTER_NAME}"
        },
        {
            "Sid": "SSMRead",
            "Effect": "Allow",
            "Action": ["ssm:GetParameter"],
            "Resource": "*"
        }
    ]
}
EOF

aws iam put-role-policy \
  --role-name KarpenterControllerRole-$CLUSTER_NAME \
  --policy-name KarpenterControllerInlinePolicy \
  --policy-document file://karpenter/karpenter-controller-policy.json

cat <<EOF > karpenter/karpenter-node-role-trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name eksctl-KarpenterNodeRole-$CLUSTER_NAME \
  --assume-role-policy-document file://karpenter/karpenter-node-role-trust-policy.json

cat <<EOF > karpenter/karpenter-node-role-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "KarpenterNodeBasic",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer",
                "ec2:DescribeInstances",
                "ec2:DescribeTags",
                "ec2:DescribeVolumes",
                "ec2:AttachVolume",
                "ec2:DetachVolume",
                "ec2:DescribeInstanceAttribute",
                "ssm:DescribeInstanceInformation",
                "ssm:GetParameter",
                "ssmmessages:CreateControlChannel",
                "ssmmessages:CreateDataChannel",
                "ssmmessages:OpenControlChannel",
                "ssmmessages:OpenDataChannel",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF

aws iam put-role-policy \
  --role-name eksctl-KarpenterNodeRole-$CLUSTER_NAME \
  --policy-name KarpenterNodeRoleInlinePolicy \
  --policy-document file://karpenter/karpenter-node-role-policy.json

aws iam attach-role-policy \
  --role-name eksctl-KarpenterNodeRole-$CLUSTER_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws ecr-public get-login-password --region us-east-1 \
  | helm registry login -u AWS --password-stdin public.ecr.aws

helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \
  --version "1.8.1" \
  --namespace karpenter --create-namespace \
  --set serviceAccount.create=true \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::${ACCOUNT_ID}:role/KarpenterControllerRole-${CLUSTER_NAME}" \
  --set "settings.clusterName=${CLUSTER_NAME}"
```

```shell
kubectl apply -f karpenter/nodepool-class.yaml
```

```shell
kubectl apply -f common/deployment.yaml
source ./common/measure-provisioning.sh
```





