# AWS EKS Gateway + VPC Lattice Demo

## AWS VPC

-   EKS VPC (`eks-vpc`) (eksctl ClusterConfig에서 생성)
    -   CIDR: `10.1.0.0/16` - EKS Cluster VPC
    -   Region: `ap-northeast-2`
-   Client VPC (`client-vpc`)
    -   CIDR: `10.2.0.0/16` - Client VPC
    -   Region: `ap-northeast-2`
    -   IGW에 연결된 Public 서브넷 필요 (SSH 접속에 필요)

## Route53 Private Hosted Zone

-   PHZ `example.com` (클러스터 VPC, 클라이언트 VPC 둘 다 연결)
-   CNAME `api.example.com` (Lattice 도메인 연결용)

## EKS Cluster

Cluster Name: `eks-demo`
Cluster Region: `ap-northeast-2`
Cluster Version: `1.33`

> [cluster.yaml](./cluster.yaml)

```shell
eksctl create cluster -f cluster.yaml
aws eks update-kubeconfig --name eks-demo --region ap-northeast-2
```

효율적인 CLI 사용을 위해 아래와 같이 환경변수 설정 (AWS CLI 로그인 필수)

```shell
export CLUSTER_NAME=eks-demo
export AWS_REGION=ap-northeast-2
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

## EKS Pod Identity, IAM Role, Policy

```shell
# 컨트롤러 IAM 정책 설정
curl -fsSL https://raw.githubusercontent.com/aws/aws-application-networking-k8s/main/files/controller-installation/recommended-inline-policy.json -o recommended-inline-policy.json

aws iam create-policy --policy-name VPCLatticeControllerIAMPolicy \
  --policy-document file://recommended-inline-policy.json

export VPCLatticeControllerIAMPolicyArn=$(aws iam list-policies \
  --query 'Policies[?PolicyName==`VPCLatticeControllerIAMPolicy`].Arn' --output text)

# 컨트롤러 네임스페이스 & 서비스 어카운트
kubectl apply -f https://raw.githubusercontent.com/aws/aws-application-networking-k8s/main/files/controller-installation/deploy-namesystem.yaml

cat > gateway-api-controller-service-account.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gateway-api-controller
  namespace: aws-application-networking-system
EOF
kubectl apply -f gateway-api-controller-service-account.yaml

# 파드 Identity 애드온 설치
aws eks create-addon --cluster-name ${CLUSTER_NAME} \
  --addon-name eks-pod-identity-agent --addon-version v1.0.0-eksbuild.1

# IAM Role 생성 (Trust Relationship 설정)
cat > eks-pod-identity-trust-relationship.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEksAuthToAssumeRoleForPodIdentity",
      "Effect": "Allow",
      "Principal": { "Service": "pods.eks.amazonaws.com" },
      "Action": ["sts:AssumeRole","sts:TagSession"]
    }
  ]
}
EOF

aws iam create-role \
  --role-name VPCLatticeControllerIAMRole \
  --assume-role-policy-document file://eks-pod-identity-trust-relationship.json \
  --description "IAM Role for AWS Gateway API Controller for VPC Lattice"

aws iam attach-role-policy \
  --role-name VPCLatticeControllerIAMRole \
  --policy-arn $VPCLatticeControllerIAMPolicyArn

export VPCLatticeControllerIAMRoleArn=$(aws iam list-roles \
  --query 'Roles[?RoleName==`VPCLatticeControllerIAMRole`].Arn' --output text)

# 서비스 어카운트에 IAM Role 연결
aws eks create-pod-identity-association \
  --cluster-name ${CLUSTER_NAME} \
  --role-arn ${VPCLatticeControllerIAMRoleArn} \
  --namespace aws-application-networking-system \
  --service-account gateway-api-controller
```

(Pod Identity로 컨트롤러 사용)

## SG Lattice Prefix List

```shell
# 클러스터 SG ID
CLUSTER_SG=$(aws eks describe-cluster --name ${CLUSTER_NAME} \
  --output json | jq -r '.cluster.resourcesVpcConfig.clusterSecurityGroupId')

# Lattice IPv4/IPv6 Prefix List ID
PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists \
  --query "PrefixLists[?PrefixListName=='com.amazonaws.$AWS_REGION.vpc-lattice'].PrefixListId" \
  | jq -r '.[]')

# 클러스터 SG에 Lattice Prefix List 인바운드 규칙 추가(Lattice가 클러스터로 트래픽을 보낼 수 있도록 허용)
aws ec2 authorize-security-group-ingress \
  --group-id $CLUSTER_SG \
  --ip-permissions "PrefixListIds=[{PrefixListId=${PREFIX_LIST_ID}}],IpProtocol=-1"

# IPv6 Lattice Prefix List ID (옵션)
PREFIX_LIST_ID_IPV6=$(aws ec2 describe-managed-prefix-lists \
  --query "PrefixLists[?PrefixListName=='com.amazonaws.$AWS_REGION.ipv6.vpc-lattice'].PrefixListId" \
  | jq -r '.[]')

# IPv6 Lattice Prefix List 인바운드 규칙 추가 (옵션)
aws ec2 authorize-security-group-ingress \
  --group-id $CLUSTER_SG \
  --ip-permissions "PrefixListIds=[{PrefixListId=${PREFIX_LIST_ID_IPV6}}],IpProtocol=-1"
```

## EKS Gateway API Controller for VPC Lattice 설치(Helm)

```shell
# Gateway API CRD 설치
kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd?ref=v1.1.0" | kubectl apply -f -

# ECR 로그인
aws ecr-public get-login-password --region us-east-1 | helm registry login --username AWS --password-stdin public.ecr.aws

# Helm Gateway API Controller 설치 (SA는 기존에 있는걸로)
helm install gateway-api-controller \
  oci://public.ecr.aws/aws-application-networking-k8s/aws-gateway-controller-chart \
  --version=v1.1.4 \
  --set=serviceAccount.create=false \
  --set=serviceAccount.name=gateway-api-controller \
  --namespace aws-application-networking-system \
  --set=log.level=info
```

Controller가 K8s Gateway/HTTPRoute CRD 감지 후 VPC Lattice 리소스 매핑

## VPC Lattice 서비스 네트워크 생성, VPC 연결

VPC 콘솔 > VPC Lattice > 서비스 네트워크 > Create

이름: `demo-sn`
Authorization type: `None` (None으로 설정 시 누구나 접근 가능)

VPC Associations > VPC 연결 생성, EKS VPC/Client VPC 둘 다 추가

```shell
# Gateway API Controller 설정 변경 (defaultServiceNetwork 설정)
helm upgrade gateway-api-controller \
  oci://public.ecr.aws/aws-application-networking-k8s/aws-gateway-controller-chart \
  --version=v1.1.4 \
  --reuse-values \
  --namespace aws-application-networking-system \
  --set=defaultServiceNetwork=demo-sn
```

## EKS Gateway, HTTPRoute 생성

> [gateway-class.yaml](./gateway-class.yaml) (GatewayClass)
> [demo-app.yaml](./demo-app.yaml) (Deployment, Service)
> [tg-policy.yaml](./tg-policy.yaml) (TargetGroupPolicy)
> [gateway.yaml](./gateway.yaml) (Gateway, HTTPRoute)
> [httproute.yaml](./httproute.yaml) (HTTPRoute)

전부 kubectl로 적용하고 아래의 명령어로 Lattice 도메인 확인

```shell
kubectl get httproute demo-http-route -o jsonpath='{.metadata.annotations.application-networking\.k8s\.aws/lattice-assigned-domain-name}'
```

## Route53 Private Hosted Zone

PHZ에 `api.example.com` 도메인 생성 후 CNAME 레코드로 Lattice 도메인 연결

Route53 > PHZ(example.com) > Create Record (VPC: eks-vpc, client-vpc 둘 다 선택)

-   Record name: `api`
-   Record type: `CNAME`
-   Value: `<Lattice 도메인>` (kubectl get httproute ... 로 확인한 도메인)
-   TTL: 30s ~ 60s

## Test

Client VPC에 EC2 하나 만들고(인터넷 접속 가능한) 아래 명령어 테스트

```shell
dig +short api.example.com
curl -i http://api.example.com
```
