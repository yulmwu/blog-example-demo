```shell
terraform init
terraform apply -auto-approve

echo "<h1>Testing</h1>" > ./index.html
aws s3 cp ./index.html s3://$(terraform output -raw s3_bucket_name)/index.html 

terraform destroy -auto-approve
```
