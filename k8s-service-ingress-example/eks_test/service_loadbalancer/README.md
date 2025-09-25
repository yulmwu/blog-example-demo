# LoadBalancer 실습

```sh
kubectl apply -f loadbalancer.yml
kubectl get svc -o wide
```

서비스 External IP로 접근 가능

```sh
curl http://...elb.amazonaws.com
```

다음 실습을 위해 삭제

```sh
kubectl delete -f loadbalancer.yml
```
