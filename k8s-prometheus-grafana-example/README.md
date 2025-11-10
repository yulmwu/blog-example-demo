```shell
kubectl create namespace monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.service.type=NodePort \
  --set prometheus.service.type=NodePort
```

```shell
cd express-metrics
docker buildx build --platform linux/amd64,linux/arm64 \
  -t rlawnsdud/prometheus-test:latest --push .
```

```shell
kubectl apply -f deployment.yaml -n monitoring
kubectl apply -f servicemonitor.yaml -n monitoring
```
