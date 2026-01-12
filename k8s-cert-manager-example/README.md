```shell
eksctl create cluster -f cluster.yaml
```

# TLS/SSL Cert with Native Object

```shell
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
kubectl apply -f native-objects/ingress.yaml
```

```shell
openssl s_client -connect $NLB_DNS:443 -servername $NLB_DNS
curl -k https://$NLB_DNS/
```

# TLS/SSL Cert with cert-manager

```shell
# (Cluster and NLB setup same as above)

kubectl get svc -n ingress-nginx
# ingress-nginx-controller   LoadBalancer   a1b2c3d4e5f6.elb.ap-northeast-2.amazonaws.com

NLB_DNS=a1b2c3d4e5f6.elb.ap-northeast-2.amazonaws.com
```

```shell
helm install cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.19.2 \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true

kubectl -n cert-manager get pods
```

```shell
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws iam create-policy \
  --policy-name cert-manager-route53-policy \
  --policy-document file://cert-manager/cert-manager-route53-policy.json

eksctl create iamserviceaccount \
  --cluster demo-cluster \
  --namespace cert-manager \
  --name cert-manager \
  --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/cert-manager-route53-policy" \
  --approve \
  --override-existing-serviceaccounts

kubectl -n cert-manager rollout restart deploy cert-manager

kubectl -n cert-manager get sa cert-manager -o yaml | yq '.metadata.annotations'
```

```shell
kubectl apply -f cert-manager/clusterissuer-staging.yaml
kubectl -n cert-manager get secret letsencrypt-staging-account-key

kubectl apply -f cert-manager/ingress.yaml
```dig 

```shell
kubectl get certificate,certificaterequest,order,challenge -A

kubectl -n default get secret demo-rlawnsdud-shop-tls -o yaml
```

```shell
curl -vk https://demo.rlawnsdud.shop/
openssl s_client -connect demo.rlawnsdud.shop:443 -servername demo.rlawnsdud.shop
```

```shell
kubectl apply -f cert-manager/clusterissuer-prod.yaml
kubectl -n default annotate ingress nlb-tls-ingress \
  cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite
```

```shell
curl -vk https://demo.rlawnsdud.shop/
openssl s_client -connect demo.rlawnsdud.shop:443 -servername demo.rlawnsdud.shop -showcerts </dev/null
```
