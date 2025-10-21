```shell
eksctl create cluster -f cluster.yaml
aws eks update-kubeconfig --name eks-istio-demo --region ap-northeast-2
```
    
```shell
istioctl install -y -f istio-gwapi.yaml
kubectl get svc -n istio-system istio-ingressgateway
```

> ```shell
> kubectl get crd -o name | rg gateway.networking.k8s.io || true
> # if not found, run:
> kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.1.0/standard-install.yaml
> kubectl get crd gateways.gateway.networking.k8s.io httproutes.gateway.networking.k8s.io
> ```

```shell
kubectl create ns demo
kubectl label ns demo istio-injection=enabled
```

```shell
kubectl apply -n demo -f deployment.yaml
```

```shell
kubectl apply -n demo -f gateway.yaml
```

```shell
kubectl apply -n demo -f httproute-myapp.yaml
kubectl apply -n demo -f httproute-otherapp.yaml
```

---

```shell
kubectl apply -n istio-system -f istio-envoy-filter.yaml
```

```shell
seq 1 100 | xargs -I{} -P100 curl -s -o /dev/null -w "%{http_code}\n" http://3.34.180.38:32165 | sort | uniq -c && curl -I http://3.34.180.38:32165
```
