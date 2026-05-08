# CAFlow Infrastructure

CAFlow deploys via **Dokploy** on a self-hosted VPS — see [`DOKPLOY.md`](DOKPLOY.md) for the deploy runbook.

## Why Dokploy

- One operator (you). Dokploy gives Heroku-class deploy ergonomics on a VPS you control.
- Built-in Postgres + Redis service provisioning, Traefik for HTTPS + routing, GitHub auto-deploys.
- Costs an order of magnitude less than AWS/Fly at this stage. ECS/managed-cloud is a Phase 5 problem if/when scale demands it.

## Files

| File | Purpose |
|---|---|
| [`DOKPLOY.md`](DOKPLOY.md) | Step-by-step deploy runbook for the CAFlow stack on Dokploy |
