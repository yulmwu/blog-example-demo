# Nginx Ingress 실습

```sh
kubectl apply -f app-cluster-ip.yml

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
    --set controller.service.type=NodePort

kubectl apply -f nginx-ingress-class.yml
kubectl apply -f nginx-ingress.yml
```
