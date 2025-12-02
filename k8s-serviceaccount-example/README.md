```shell
kubectl apply -f sa.yaml
TOKEN=$(kubectl -n default create token foo)

# Minikube, if you are using another cluster, change the CA path and API server URL accordingly
CA_PATH=~/.minikube/ca.crt
API_SERVER="https://127.0.0.1:50232"
```

```shell
curl --header "Authorization: Bearer $TOKEN" \
     --cacert $CA_PATH $API_SERVER/api/v1/namespaces/default/pods
```

```shell
curl --header "Authorization: Bearer $TOKEN" \
     --cacert $CA_PATH $API_SERVER/api/v1/namespaces

# 네임스페이스 생성 시도
curl --header "Authorization: Bearer $TOKEN" \
     --cacert $CA_PATH -X POST \
     -H "Content-Type: application/json" \
     -d '{"apiVersion":"v1","kind":"Namespace","metadata":{"name":"test-namespace"}}' \
     $API_SERVER/api/v1/namespaces
```

---

```yaml
kubectl apply -f pod-role.yaml
kubectl apply -f pod-rolebinding.yaml

kubectl apply -f ns-clusterrole.yaml
kubectl apply -f ns-clusterrolebinding.yaml
```

---

```shell
kubectl -n default run k8s-client-demo --image=rlawnsdud/k8s-client-demo:latest --restart=Never --command -- sleep 3600
kubectl -n default exec -it k8s-client-demo -- /bin/sh
```

```shell
kubectl -n default delete pods/k8s-client-demo
kubectl -n default apply -f k8s-client-demo.yaml
```
