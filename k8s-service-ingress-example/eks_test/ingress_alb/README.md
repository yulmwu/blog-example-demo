# ALB Ingress 실습

```sh
kubectl apply -f alb-ingress-deployment.yml
kubectl apply -f alb-ingress-cluster-ip.yml
```

OIDC/IRSA로 AWS LoadBalancer Ingress Controller 설치 필요

```sh
eksctl utils associate-iam-oidc-provider --region ap-northeast-2 --cluster eks-test --approve

curl -fsSL -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam-policy.json

# {ACCOUNT_ID} 채우기
eksctl create iamserviceaccount \
  --cluster eks-test \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --attach-policy-arn arn:aws:iam::{ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName=eks-test \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

상태 확인:

```sh
kubectl get pods -n kube-system -o wide | grep -i aws-load-balancer-controller
```

```sh
kubectl apply -f alb-ingress-class.yml
```

```sh
kubectl apply -f alb-ingress.yml
```

```sh
kubectl get alb-ingress -o wide
```

External IP가 `a1b2c3d4e5f6g7h8i9j0.elb.amazonaws.com` 형태로 나타나야 함
