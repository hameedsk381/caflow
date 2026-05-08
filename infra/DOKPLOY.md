# CAFlow on Dokploy — Deploy Runbook

Self-hosted Dokploy on a VPS you control. Provisions Postgres + Redis as Dokploy-managed services, deploys the FastAPI backend and Next.js frontend as separate Dokploy applications, fronts both with Traefik for HTTPS + routing.

## Prerequisites

- A VPS with Dokploy installed and reachable on a public IP.
  - Recommended size for dev: 2 vCPU, 4 GB RAM, 60 GB disk (Hetzner CPX21, DigitalOcean s-2vcpu-4gb, Contabo VPS S all work).
  - Region: pick India-adjacent for latency (Hetzner Helsinki/Falkenstein, DO Bangalore, Contabo Asia). For the data-residency story to mid-size firms, a Mumbai / Bangalore region is ideal.
- A domain you control, with DNS pointed at the VPS (Dokploy uses Traefik + Let's Encrypt for HTTPS).
- GitHub repo access in Dokploy (OAuth or deploy key).

## One-time stack setup

In the Dokploy web UI:

### 1. Project

Create a project called `caflow`. All services below live under this project.

### 2. Postgres service

- **Type:** Database → PostgreSQL
- **Name:** `caflow-postgres`
- **Version:** 16
- **Database:** `caflow`
- **User:** `caflow`
- **Password:** generate a strong one (`openssl rand -base64 32`) — Dokploy stores it in its secrets store.

After creation, Dokploy gives you an internal connection string like:
```
postgresql://caflow:<password>@caflow-postgres:5432/caflow
```
The hostname `caflow-postgres` resolves on the Docker network shared by Dokploy services. **Backend uses this internal hostname**, not a public one — Postgres is not exposed to the internet.

### 3. Redis service

- **Type:** Database → Redis
- **Name:** `caflow-redis`
- **Version:** 7
- **Password:** optional but recommended.

Internal hostname: `caflow-redis:6379`.

### 4. Backend application

- **Type:** Application → Docker
- **Name:** `caflow-backend`
- **Source:** GitHub → this repo
- **Branch:** `main`
- **Build Type:** Dockerfile
- **Dockerfile path:** `backend/Dockerfile`
- **Build context:** `backend/`
- **Port:** `8000`

Environment variables (Dokploy UI → app → Environment):

```env
APP_ENV=dev
APP_NAME=CAFlow
APP_VERSION=1.0.0
SECRET_KEY=<openssl rand -base64 48>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

DATABASE_URL=postgresql+asyncpg://caflow:<password>@caflow-postgres:5432/caflow
DATABASE_URL_SYNC=postgresql://caflow:<password>@caflow-postgres:5432/caflow

REDIS_URL=redis://:<redis-password>@caflow-redis:6379/0

ALLOWED_ORIGINS=https://app.<your-domain>

# Observability (set once Sentry project exists)
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1

# Phase 1+ secrets — leave empty until each integration lands
GROQ_API_KEY=
```

Domain (Dokploy UI → app → Domains):
- Add `api.<your-domain>` → port 8000, Let's Encrypt enabled.

### 5. Frontend application

- **Type:** Application → Docker
- **Name:** `caflow-frontend`
- **Source:** GitHub → this repo
- **Branch:** `main`
- **Build Type:** Dockerfile
- **Dockerfile path:** `frontend/Dockerfile`
- **Build context:** `frontend/`
- **Port:** whatever the existing Next.js Dockerfile exposes (typically 3000).

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.<your-domain>
NODE_ENV=production
```

Domain:
- Add `app.<your-domain>` → port 3000, Let's Encrypt enabled.

### 6. Auto-deploy on push

In each application's settings, enable "Auto deploy on push to main". Dokploy listens to a GitHub webhook and rebuilds + redeploys on every push.

## First deploy

In Dokploy, click **Deploy** on `caflow-backend`. Watch the build logs — should pull the repo, build the Docker image, run the container.

Once green, exec into the container to apply migrations:

```
# Dokploy UI → caflow-backend → Terminal
alembic upgrade head
```

Then deploy `caflow-frontend` the same way.

Smoke-test:

```
curl -sf https://api.<your-domain>/health        # expect 200 with {"status":"ok",...}
curl -sf https://app.<your-domain>/              # expect 200
curl -s https://api.<your-domain>/api/portal-sync/anything -o /dev/null -w "%{http_code}\n"
                                                 # expect 410 (deprecated stub from Phase 0)
```

## Backups (do this on day one)

Dokploy has built-in scheduled backups for managed databases:

- Project → caflow-postgres → Backups → Add schedule
- Frequency: daily, retain 14 days
- Destination: S3-compatible (Backblaze B2, Cloudflare R2, Hetzner Storage Box) — pick one outside the VPS for disaster recovery.

Test a restore at least once before any real customer data lands.

## Sentry

Once you create a Sentry project:

1. Copy the DSN.
2. Dokploy UI → caflow-backend → Environment → set `SENTRY_DSN`.
3. Redeploy.
4. Trigger a test error from the container terminal:
   ```
   python -c "import sentry_sdk; sentry_sdk.init('$SENTRY_DSN'); sentry_sdk.capture_message('hello from dokploy')"
   ```
5. Confirm the event appears in Sentry within ~30s.

## Production hardening (for when v1.0 nears launch — Phase 5)

- Move to a separate VPS for the database (avoids app-bug → db-load coupling).
- Enable `pgvector` extension on Postgres for the AI assistant phase: `CREATE EXTENSION IF NOT EXISTS vector;`
- Set up off-VPS backups + monthly restore drills.
- Configure UptimeRobot or BetterStack to ping `/health` every minute.
- Lock down SSH (key-only, fail2ban, non-default port).
- Run `lynis audit system` quarterly.

## Files in this repo Dokploy reads

- `backend/Dockerfile` — backend container definition.
- `backend/.dockerignore` — keeps `venv*`, `tests/`, `uploads/` etc. out of the image.
- `frontend/Dockerfile` — frontend container definition (pre-existing).
- `.env.example` files document the env vars Dokploy needs you to set.

No Terraform, no Fly config, no AWS secrets — Dokploy handles all of it via its own UI + state.
