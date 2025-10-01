```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

```shell
kubectl create namespace monitoring
```

```shell
helm install kps prometheus-community/kube-prometheus-stack \
  -n monitoring -f kps-values.yaml
```

```shell
kubectl get all -n monitoring
```

```shell
kubectl port-forward -n monitoring svc/kps-grafana 3000:80
# Grafana password (admin:password=prom-operator)
kubectl --namespace monitoring get secrets kps-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo
```

```shell
kubectl apply -f deployment.yaml
kubectl apply -f service-monitor.yaml
```

```shell
kubectl get servicemonitor -n monitoring
```
