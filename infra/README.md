# CAFlow Infrastructure

Terraform-managed AWS resources for the CAFlow data plane (RDS Postgres, ElastiCache Redis, Secrets Manager).

The application itself runs on Fly.io (`sin` region) — see `fly.toml` at repo root. Fly connects out to RDS / Redis in AWS Mumbai over public endpoints, locked down by security-group rules.

## Why this split

- **Data plane on AWS Mumbai (`ap-south-1`)** — required for India data residency promised to mid-size CA firms. RDS gives us mature backup/PITR/HA when we need it.
- **App plane on Fly.io Singapore (`sin`)** — closest Fly region to India until Mumbai launches. Single-binary `flyctl` deploys; one-tenth the operational complexity of ECS/Fargate at this stage. ECS migration is a Phase 5 problem if/when we need it.

## Bootstrap (one-time)

1. Create an S3 bucket for Terraform state in `ap-south-1`. Enable versioning + server-side encryption.
   Suggested name: `caflow-tfstate-<your-aws-account-id>`.
2. Generate the RDS master password and export it:
   ```bash
   export TF_VAR_db_password="$(openssl rand -base64 32)"
   ```
3. (Optional) Save it to AWS Secrets Manager for retrieval later — it does not appear anywhere else.

## Plan / apply

```bash
cd infra/terraform
terraform init \
  -backend-config="bucket=caflow-tfstate-<your-account-id>" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=ap-south-1"

terraform plan -var env=dev
terraform apply -var env=dev
```

Outputs `db_endpoint` and `redis_endpoint` go into Fly secrets in Task 17 of the Phase 0 plan.

## Security note

`infra/terraform/network.tf` opens RDS and Redis ports to `0.0.0.0/0` to unblock the initial Fly deploy. **Task 17 of the Phase 0 plan tightens this** by replacing the CIDR rules with Fly.io's published egress IPs (one `/32` per IP, fetched via `fly ips list`).

Do not promote any environment to "prod" tier with the open rule still in place.

## Files

| File | Purpose |
|---|---|
| `main.tf` | Provider, S3 backend, default tags |
| `variables.tf` | Inputs (region, env, CIDR, db_password) |
| `network.tf` | VPC, subnets, subnet groups, data-plane security group |
| `data.tf` | RDS Postgres 16, ElastiCache Redis 7 |
| `secrets.tf` | AWS Secrets Manager skeleton (populated as integrations land) |
| `outputs.tf` | Endpoints + ARNs for downstream wiring |
