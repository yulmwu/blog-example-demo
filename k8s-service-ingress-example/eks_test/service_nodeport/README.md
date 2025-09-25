# NodePort 실습

```sh
kubectl apply -f nodeport.yml
kubectl get svc,node -o wide
```

이때 퍼블릭 노드의 External IP가 나옴

```sh
curl http://ExternalIP:30001
```

다음 실습을 위해 삭제

```sh
kubectl delete -f nodeport.yml
```
