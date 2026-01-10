```shell
eksctl create cluster -f cluster.yaml
```

# TLS/SSL Cert with Native Object

```shell
cd native-objects

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx \
  --create-namespace \
  -f values.yaml

kubectl get svc -n ingress-nginx
# ingress-nginx-controller   LoadBalancer   a1b2c3d4e5f6.elb.ap-northeast-2.amazonaws.com

NLB_DNS=a1b2c3d4e5f6.elb.ap-northeast-2.amazonaws.com

kubectl apply -f app.yaml
```

```shell
openssl genrsa -out key.pem 2048
openssl req -new -key key.pem -out csr.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=Lab/OU=TLS/CN=nginx"
openssl x509 -req \
  -in csr.pem \
  -signkey key.pem \
  -out crt.pem \
  -days 365 \
  -extfile <(cat <<EOF
subjectAltName=DNS:$NLB_DNS
EOF
)

openssl x509 -in crt.pem -text -noout | grep -A2 "Subject Alternative Name"
```

```shell
kubectl create secret tls nlb-tls-secret \
  --cert=crt.pem \
  --key=key.pem \
  -n default

kubectl get secret nlb-tls-secret -n ingress-nginx
```

```shell
# Edit native-objects/ingress.yaml to set hosts
kubectl apply -f ingress.yaml
```

```shell
openssl s_client -connect $NLB_DNS:443 -servername $NLB_DNS
curl -k https://$NLB_DNS/
```
