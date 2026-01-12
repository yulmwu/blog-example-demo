```shell
eksctl create cluster -f cluster.yaml
aws eks update-kubeconfig --name demo-cluster --region ap-northeast-2
kubectl get nodes
```

```shell
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm install keda kedacore/keda --namespace keda --create-namespace
```

# KEDA, SQS

Need to create an SQS queue first. (or use existing one)

```shell
SQS_QUEUE_NAME="keda-demo-queue"

aws sqs create-queue \
  --queue-name "$SQS_QUEUE_NAME" \
  --region "ap-northeast-2"

SQS_QUEUE_URL=$(aws sqs get-queue-url \
  --queue-name "$SQS_QUEUE_NAME" \
  --region "ap-northeast-2" \
  --query 'QueueUrl' --output text)
```

```shell
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

aws iam create-policy \
  --policy-name "KedaSqsScalerPolicy" \
  --policy-document file://sqs/keda-sqs-scaler-policy.json \
  --query 'Policy.Arn' --output text

eksctl create iamserviceaccount \
  --cluster demo-cluster \
  --namespace keda \
  --name keda-operator \
  --role-name "keda-operator-role" \
  --attach-policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/KedaSqsScalerPolicy" \
  --role-only \
  --approve \
  --region ap-northeast-2

helm upgrade --install keda kedacore/keda \
  --namespace keda \
  --create-namespace \
  --set podIdentity.aws.irsa.enabled=true \
  --set podIdentity.aws.irsa.roleArn="arn:aws:iam::${ACCOUNT_ID}:role/keda-operator-role"

```

```shell
kubectl apply -f application.yaml
kubectl apply -f sqs/trigger-authn.yaml
kubectl apply -f sqs/scaled-object.yaml
```

```shell
kubectl get deploy,scaledobject,hpa
kubectl get pods -w
```

```shell
for i in $(seq 1 30); do
  aws sqs send-message --queue-url "$SQS_QUEUE_URL" --message-body "msg-$i" --region "ap-northeast-2" >/dev/null
done

aws sqs purge-queue --queue-url "$SQS_QUEUE_URL" --region "ap-northeast-2"
```

```shell
# cleanup

kubectl delete -f sqs/scaled-object.yaml
kubectl delete -f sqs/trigger-authn.yaml
kubectl delete -f application.yaml

helm uninstall keda -n keda

eksctl delete iamserviceaccount \
  --cluster demo-cluster \
  --namespace keda \
  --name keda-operator \
  --region ap-northeast-2
aws iam delete-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/KedaSqsScalerPolicy"

eksctl delete cluster -f cluster.yaml
```
