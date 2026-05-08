# Fly.io Deploy Runbook

The CAFlow backend deploys to Fly.io (`sin` region) and connects to AWS Mumbai RDS + Redis.

## One-time setup

Prerequisites: AWS infra applied via `infra/terraform/` (Task 16). Outputs `db_endpoint` and `redis_endpoint` available.

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Authenticate
fly auth login

# Bootstrap the app (does NOT deploy yet)
cd backend
fly launch --no-deploy --copy-config --name caflow-dev

# Set secrets — paste the RDS / Redis endpoints from `terraform output`
fly secrets set \
  DATABASE_URL="postgresql+asyncpg://caflow:${TF_VAR_db_password}@<db_endpoint>:5432/caflow" \
  DATABASE_URL_SYNC="postgresql://caflow:${TF_VAR_db_password}@<db_endpoint>:5432/caflow" \
  REDIS_URL="redis://<redis_endpoint>:6379/0" \
  SECRET_KEY="$(openssl rand -base64 48)" \
  SENTRY_DSN="<your-sentry-dsn>" \
  ALGORITHM="HS256" \
  ACCESS_TOKEN_EXPIRE_MINUTES=60 \
  REFRESH_TOKEN_EXPIRE_DAYS=7 \
  ALLOWED_ORIGINS="https://caflow-dev.fly.dev"
```

## Tighten RDS security group to Fly egress IPs

Fly assigns dedicated IPs per app. Get them once:

```bash
fly ips list
# Note the v4 IPs.
```

Edit `infra/terraform/network.tf`: replace each `cidr_blocks = ["0.0.0.0/0"]` on the `aws_security_group.data` ingress rules with `["<fly-ip-1>/32", "<fly-ip-2>/32", ...]`. Then:

```bash
cd infra/terraform
terraform apply -var env=dev
```

## Deploy

```bash
cd backend
fly deploy
fly logs   # watch until "Application startup complete"
curl https://caflow-dev.fly.dev/docs
```

If migrations need to run on first deploy, the app's lifespan handler triggers them automatically. To run them manually:

```bash
fly ssh console -C "alembic upgrade head"
```

## Smoke test

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://caflow-dev.fly.dev/health
# Expected: 200
```

Trigger a Sentry test event:

```bash
fly ssh console -C "python -c 'import sentry_sdk; sentry_sdk.capture_message(\"hello from fly\")'"
```

Verify the event appears in your Sentry project within ~30s.
