# 실습에 사용할 배포(Deployment) 생성

```sh
kubectl apply -f testapp-deployment.yml
kubectl get pods -o wide
```

단, ALB Ingress 예제에선 환경 변수 `GLOBAL_PREFIX`를 사용함
