```shell
terraform init
terraform apply -auto-approve

aws s3 cp ./index.html s3://$(terraform output -raw s3_bucket_name)/index.html

terraform destroy -auto-approve
```
