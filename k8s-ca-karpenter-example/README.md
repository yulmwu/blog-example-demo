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
          "%s:sub": "system:serviceaccount:karpenter:karpenter-controller",
          "%s:aud": "sts.amazonaws.com"
        }
      }
    }]
  }' "$ACCOUNT_ID" "$OIDC_PROVIDER" "$OIDC_PROVIDER" "$OIDC_PROVIDER")

aws iam put-role-policy \
  --role-name KarpenterControllerRole-$CLUSTER_NAME \
  --policy-name KarpenterControllerInlinePolicy \
  --policy-document file://karpenter-controller-policy.json

helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \
  --version "1.8.1" \
  --namespace karpenter --create-namespace \
  --set serviceAccount.create=true \
  --set serviceAccount.name=karpenter-controller \
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





