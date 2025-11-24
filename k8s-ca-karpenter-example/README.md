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

kubectl apply -f karpenter/nodepool-class.yaml
```

```shell
kubectl apply -f common/deployment.yaml
source ./common/measure-provisioning.sh
```





