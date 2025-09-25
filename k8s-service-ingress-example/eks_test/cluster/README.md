# EKS 클러스터 구성

```sh
eksctl create cluster -f cluster-config.yml
aws eks update-kubeconfig --name eks-test --region ap-northeast-2

kubectl get nodes -o wide
```
