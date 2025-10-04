[Kustomize Demo Repository](https://github.com/eocndp/argocd-kustomize-demo)

```shell
kubectl create namespace argocd

helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd \
  --namespace argocd \
  --set server.service.type=NodePort # or LoadBalancer
```

```shell
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo

kubectl -n argocd port-forward svc/argocd-server 8080:80
```

```shell
kubectl apply -f argocd-project.yaml
kubectl apply -f argocd-dev-application.yaml
kubectl apply -f argocd-prod-application.yaml
```
