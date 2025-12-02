```shell
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t rlawnsdud/k8s-client-demo:latest \
  --push .
```
