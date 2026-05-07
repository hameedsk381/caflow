# CAFlow — Mid-Size Sellability Design

**Date:** 2026-05-07
**Owner:** Vinay Surasani (solo)
**Status:** Draft for review
**Goal:** Take CAFlow from feature-broad scaffold to a product with credible feature parity with Turia/Suvit, sellable to mid-size Indian CA firms (10–50 seats) at ₹1–2k/seat/month.

---

## 1. Constraints and decisions on record

| Decision | Choice |
|---|---|
| Team | Solo, ~30 focused hours/week |
| Timeline | 9 months (Option α — honest sizing, see §3) |
| Success criterion | Product feature parity with Turia/Suvit |
| Build vs buy | Hybrid: buy commodity integrations (GSP, MCA, OCR, WhatsApp, payments), build workflow + AI + product UX |
| AI provider | Groq (Llama 3.3 70B / Qwen / DeepSeek) primary, Claude fallback for complex reasoning, behind a provider abstraction |
| Mobile strategy | PWA (installable, push, offline read, geo-attendance via browser) |
| Hosting | India region (AWS Mumbai or Azure India), shared multi-tenant by default, single-tenant DB schema per firm on paid request |
| Current users | Pre-launch, no production users — schemas/APIs free to break |
| Pricing target | ₹1–2k/seat/month (mainstream mid-size tier) |

---

## 2. Strategic positioning

CAFlow is a **workflow-first, AI-assisted practice management suite for mid-size Indian CA firms**.

- **Parity** with Turia/Suvit on table-stakes: GST/MCA sync, OCR, Tally export, WhatsApp client comms, payments, audit log.
- **Wins on**:
  1. Modern PWA UX (incumbents are dated)
  2. Deeper workflow automation around notices and deadlines
  3. Embedded AI assistant for notice classification, deadline reasoning, and scoped Q&A
  4. Optional single-tenant DB for security-sensitive firms

The differentiator that justifies switching is **the workflow + AI layer on top of integrated data**, not the data fetch itself. Resourcing should reflect this — buy the data plumbing, invest the build budget in workflow and AI.

---

## 3. Scope cut

### 3.1 In scope (must ship for parity)

| Capability | Approach |
|---|---|
| GST returns / notices / ledger sync | GSP API |
| MCA / CIN sync | MCA API provider |
| OCR (invoices, bank stmts, Form 26AS, notices) | Mindee / Nanonets |
| WhatsApp client comms (templated reminders, opt-in, status) | BSP (AiSensy / WATI) |
| Tally Prime XML export | In-house |
| Payments + subscription billing (firm pays CAFlow) | Razorpay |
| AI assistant (notice classifier, deadline reasoner, scoped chat) | Groq, Claude fallback |
| Notice intelligence pipeline (OCR → classify → deadline → task → WA alert) | In-house |
| RBAC depth (owner / partner / manager / staff / article / read-only / client-portal) | In-house |
| Audit log (full mutation history, exportable) | In-house |
| PWA polish (installable, push, offline read, geo-attendance) | In-house |
| Self-serve onboarding (signup → CSV import → GSTIN connect → invite team → plan pick) | In-house |
| Production hardening (rate limit, observability, backups, error tracking, secrets) | In-house + tooling |
| India-region hosting + optional single-tenant DB | Infra |
| Compliance / notice / deadline UX overhaul (workflow moat) | In-house |
| Client portal (firm's clients upload docs, see status) | In-house |
| Code cleanup of scaffold modules (`portal_sync.py`, `communication.py`, etc.) | In-house |

### 3.2 Explicitly deferred (post-launch v1.1+)

- Native mobile apps (PWA covers field staff and partner approvals)
- White-label / reseller program
- Tally **direct sync** (export-only is enough for parity)
- E-invoicing / e-way bill **generation** (consume only via GSP)
- Payroll, reimbursements UI (basic attendance + leave stay)
- CRM marketing automation (basic lead capture stays)
- SOC2 / ISO certification (start the documentation process, not a launch blocker)
- SSO / SAML (revisit if a deal demands it)

### 3.3 Cuts from current code

Audit during Phase 0 (see §6) and decide per module: delete, keep as stub, or replace.
- `backend/app/api/portal_sync.py` — replace with GSP-driven sync workers.
- `backend/app/api/communication.py` — replace with BSP-backed WhatsApp service.
- Scripts at repo root (`backend/add_priya.py`, `backend/check_users.py`, `frontend/fix_*.py`, `frontend/script.py`, `frontend/table_script.py`) — move to `scripts/` or delete.
- Any other scaffold/dead code surfaced by the audit.

---

## 4. Architecture

### 4.1 Integration layer (new)

Goal: third-party failures degrade gracefully, provider swaps are cheap, per-firm credentials stay isolated, costs are observable per firm.

```
backend/app/integrations/
├── base.py              # Provider interface, retry + circuit-breaker, cost metering
├── gsp/
│   ├── base.py          # GSPProvider ABC (returns, notices, ledger, einvoice)
│   ├── <vendor>.py      # Concrete impl (chosen during Phase 1)
│   └── mock.py          # For tests
├── mca/
│   ├── base.py          # MCAProvider ABC
│   └── <vendor>.py
├── ocr/
│   ├── base.py          # OCRProvider ABC (parse_invoice, parse_bank_stmt, parse_26as, parse_notice)
│   └── <vendor>.py
├── whatsapp/
│   ├── base.py          # WhatsAppProvider ABC (send_template, webhook_handler)
│   └── <vendor>.py
├── ai/
│   ├── base.py          # AIProvider ABC (classify, summarize, chat, embed)
│   ├── groq.py          # Primary
│   └── claude.py        # Fallback for hard tasks
└── payments/
    ├── base.py          # PaymentProvider ABC
    └── razorpay.py
```

**Cross-cutting in `integrations/base.py`:**
- Circuit breaker (`pybreaker` or equivalent): N failures → short-circuit M minutes.
- Retry with jitter on idempotent reads only. **Writes never auto-retry** — book-keeping calls to a CA portal must not double-fire.
- Per-firm credentials stored in extended `vault` table (encrypted, decrypted only at call time, never logged).
- `provider_call_log` table: `firm_id, provider, endpoint, cost_paise, latency_ms, status, request_id`. Drives per-firm cost reporting and runaway detection.
- Webhook receivers: signature verify → enqueue to RQ → idempotent handler.

### 4.2 Background workers

Stack: **Redis + RQ** (already in deps). Upgrade path to Celery if work grows.

- `gst_sync_worker` — schedules per-GSTIN polls (returns status, new notices, ledger updates)
- `mca_sync_worker` — schedules per-CIN polls (forms, directors)
- `whatsapp_outbound_worker` — drains reminder queue, respects WA rate limits
- `ocr_worker` — async OCR jobs from document uploads, writes results back to documents/notices
- `dunning_worker` — Razorpay retry orchestration on subscription failures
- `notice_pipeline_worker` — orchestrates the OCR → classify → deadline → task → WA alert chain

### 4.3 AI layer

```
backend/app/services/ai/
├── provider.py          # AIProvider abstraction, retries, cost log
├── classifier.py        # Notice type classification (GSTR-3A, ITR-143(1), etc.)
├── deadline_reasoner.py # Reads notice + statutory_calendar → suggests deadline + priority
├── recon_helper.py      # GST 2A/2B vs purchase register reconciliation suggestions
├── chat.py              # Scoped chat: per-firm RAG over compliance/notice/task/document data
└── prompts/             # Versioned prompt library
```

- Embeddings stored in Postgres via `pgvector` (avoid running a separate vector DB solo).
- RAG scope is strictly per-firm — a tenancy guard wraps every retrieval call.
- All AI calls emit cost rows to `provider_call_log`.
- Hard tasks (multi-step recon) gated by a feature flag to fall through to Claude when Groq output quality is insufficient.

### 4.4 Multi-tenancy

- Default: shared Postgres, row-level tenancy on `firm_id` (current model).
- Paid tier: per-firm Postgres **schema** in same cluster, provisioned by a Terraform-driven script. Connection routing decided at request time by `firm_id → schema` map cached in Redis.
- Tenancy middleware audited end-to-end in Phase 4 — every query path must filter by `firm_id` or be flagged.

### 4.5 RBAC

Roles: `owner, partner, manager, staff, article, read_only, client_portal`. Permission matrix is data, not code:

```
permissions(role, resource, action) -> bool
```

Stored in a seeded table, enforced via FastAPI dependency. Existing role checks migrated in Phase 4.

### 4.6 Audit log

SQLAlchemy event listeners on every model write → `audit_log(firm_id, actor_id, entity_type, entity_id, action, before_json, after_json, ip, user_agent, request_id, ts)`. Exportable as CSV per firm. No PII in logs at server level beyond what the entity itself stores.

### 4.7 PWA

- `next-pwa` (or hand-rolled service worker) for install + offline.
- Push: web-push (VAPID) on supported browsers, FCM bridge for Android Chrome at scale.
- Offline read for: clients list, tasks assigned to me, today's deadlines, notices.
- Offline write: deferred to v1.1 (sync conflict handling is its own project).
- Geo-attendance: browser geolocation API + reverse-geocode server-side; field staff flow is a dedicated mobile-first screen.

---

## 5. Build list with effort

Solo dev, ~30 focused hrs/week. Includes tests, docs, manual QA.

### 5.1 In-house

| # | Module | Where | Effort |
|---|---|---|---|
| 1 | Tally export | `backend/app/services/tally_export/` | 3w |
| 2 | Subscription billing | `backend/app/services/billing_subscriptions/`, `app/api/subscriptions.py` | 3w |
| 3 | AI assistant (Groq) | `backend/app/services/ai/`, frontend chat UI | 4w |
| 4 | Notice intelligence pipeline | `backend/app/services/notice_pipeline/` | 2w |
| 5 | RBAC depth | `backend/app/core/security.py`, `models/user.py`, migration | 2w |
| 6 | Audit log | `backend/app/core/audit.py`, middleware | 1.5w |
| 7 | PWA polish | `frontend/` | 3w |
| 8 | Self-serve onboarding | `frontend/app/(onboarding)/`, backend wiring | 2w |
| 9 | Production hardening | infra + cross-cutting | 3w |
| 10 | India hosting + tenant DB provisioning | infra | 2w |
| 11 | Compliance / notice / deadline UX overhaul | `frontend/app/(dashboard)/compliance/`, `notices/` | 3w |
| 12 | Code cleanup & dead-code removal | repo-wide | 1w |
| 13 | Client portal | `frontend/app/(portal)/`, backend scoped APIs | 3w |
| | **Subtotal** | | **32.5w** |

### 5.2 Integration glue

| Integration | Effort |
|---|---|
| GSP + sync workers | 4w |
| MCA + sync worker | 2w |
| OCR + worker | 2w |
| WhatsApp BSP + outbound worker + webhooks | 2w |
| Razorpay (covered in #2) | — |
| **Subtotal** | **10w** |

**Total: ~42.5 weeks** of focused build. Calendar plan is 9 months (≈39 weeks).

### 5.3 Calendar realism

The 3.5-week gap between effort and calendar is closed by **parallel work during external waits**:

- GSP/MCA sandbox approvals (1–2 weeks of mostly waiting in Phase 1) overlap with starting Tally export.
- WhatsApp template approval (5–10 business days in Phase 2) overlaps with notice pipeline build.
- OCR/Razorpay account verification waits overlap with frontend work.

This is real, not wishful. But it means Phases 4 and 5 carry the slip risk — if vendor waits go faster than expected, the buffer doesn't materialise. Treat any Phase 4–5 overrun as expected and absorb by extending to month 10 rather than cutting scope. Alternatively, the lowest-pain trim if forced is to ship the **client portal in v1.1** (saves 3w, defers a feature mid-size firms increasingly want but won't fail a deal over on day one).

---

## 6. Phased 9-month roadmap

Week numbers are calendar weeks from kickoff. Each phase ends with a **demoable milestone** so progress is observable.

### Phase 0 — Foundation (Weeks 1–3)

- Code audit: `portal_sync.py`, `communication.py`, scaffold modules, root scripts → delete or keep with intent.
- Stand up `backend/app/integrations/` skeleton with `base.py` (circuit breaker, retry, cost log).
- `provider_call_log` table + admin view.
- Sentry, structlog, basic Loki/Grafana wired up.
- AWS Mumbai account, Terraform skeleton for VPC + RDS + Redis + ECS/Fly.io.
- CI green: typecheck, lint, pytest, frontend tests run on every PR.
- **Milestone:** new branch deploys cleanly to a dev environment in AWS Mumbai with telemetry.

### Phase 1 — GSP + MCA + Tally start (Weeks 4–10)

- Evaluate 2 GSPs against checklist (sandbox quality, API completeness, pricing, SLA, support, sample code). Sign sandbox agreements only — no annual commits yet.
- Build GSP provider impl + sync worker. Cover: returns status, notices, ledger, GSTR-2A/2B fetch.
- Evaluate 2 MCA providers, pick one, build impl + sync worker.
- Vault extension for per-firm portal credentials.
- Replace `portal_sync.py` with new sync UX in compliance pages.
- **Parallel during sandbox waits:** start Tally export (XML schema research, voucher mapping draft).
- **Milestone:** demo firm with 5 GSTINs sees live returns + notices + ledger pulled and refreshed nightly.

### Phase 2 — OCR + Notice intelligence + WhatsApp (Weeks 11–17)

- OCR provider impl + worker. Document upload triggers OCR; results attached to entity.
- Notice intelligence pipeline: OCR → classify (Groq) → extract deadline/amount → auto-create task → notify.
- WhatsApp BSP integration + outbound worker. Templates approved with Meta (this often takes 5–10 business days — start on day 1 of phase).
- WhatsApp inbound webhook for delivery/read receipts.
- Notification rules engine extended to fan-out via WA + email + in-app.
- **Parallel during WA template approval waits:** finish Tally export.
- **Milestone:** uploading a GSTR-3A notice PDF auto-creates a task with deadline and fires a WhatsApp reminder to the assigned staff and the client; Tally Prime XML export downloadable for any billing period.

### Phase 3 — AI assistant (Weeks 18–22)

- Groq provider, Claude fallback, prompt versioning, cost log.
- pgvector + per-firm RAG ingestion job (compliance, notices, tasks, documents).
- Chat UI in frontend. Scoped strictly to current firm.
- Deadline reasoner integrated into compliance dashboard.
- GST recon helper (2A/2B vs purchase register) — flag mismatches with suggested actions.
- **Milestone:** partner can ask "what's pending this week for client X" and "what changed in their GST 2A vs purchases" and get accurate scoped answers.

### Phase 4 — Productisation (Weeks 23–30)

- RBAC matrix migration: define roles, permission table, enforce via dependency, migrate every endpoint.
- Audit log via SQLAlchemy events, CSV export.
- Subscription billing: Razorpay plans, seat-based pricing, dunning, GST invoice generation.
- Self-serve onboarding wizard.
- Tenancy audit: every query path verified to filter by `firm_id`. Add a CI grep for unsafe patterns.
- **Milestone:** anyone can sign up at the public URL, complete onboarding without your intervention, pay with a card, and have a working firm with WhatsApp + GST sync live in <30 minutes.

### Phase 5 — UX moat + client portal + hardening (Weeks 31–39)

- Compliance / notice / deadline UX overhaul: unified calendar across firm, partner dashboard, kanban for notices, SLA timers, bulk ops.
- Client portal: firm's clients sign in (magic link), upload documents to their folder, see filing status, sign engagement letters.
- PWA polish: installable, push notifications, offline read, geo-attendance flow.
- Single-tenant DB provisioner (Terraform module + admin trigger).
- Final hardening: rate limits, backup + restore drill, secrets rotation, CSP, DB pool tuning, load test at 10x expected traffic, runbook for the top 10 incidents.
- Public landing page, pricing page, docs site, demo environment.
- **Milestone:** v1.0 ready for paid acquisition — first three pilot mid-size firms onboarded.

---

## 7. Provider selection — execution-time decisions

The plan deliberately does not name vendors. During Phase 1/2 evaluate at least two per category against:

- **Sandbox quality**: can you build against it without a sales call? Is auth simple? Are docs current?
- **API completeness**: does it cover every endpoint in §3.1's needs without gaps requiring scraping?
- **Pricing model**: per-call, per-GSTIN/month, flat? Model out cost at 5 firms × 50 GSTINs and at 50 firms × 50 GSTINs — pick the curve that survives growth.
- **SLA + support**: response time on tickets, status page history, named support contact for ₹X+/mo.
- **Switching cost**: how data is shaped on the way in. Keep our internal models neutral so a swap is contained to the provider impl.

Categories to evaluate when each phase opens:
- GSP (Phase 1)
- MCA (Phase 1)
- OCR (Phase 2)
- WhatsApp BSP (Phase 2)

---

## 8. Risks and mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| GSP sandbox docs lie / endpoints incomplete | High | Phase 1 slippage | Evaluate 2 vendors in parallel, keep mock provider, sign no annual contract before sandbox proves out |
| WhatsApp template approval delay | High | Phase 2 slippage | Submit templates on day 1 of Phase 2; have email + in-app fallback live first so delay is non-blocking |
| Groq output quality insufficient on recon | Medium | Phase 3 weak demo | Provider abstraction with Claude fallback gated by feature flag per task type |
| Solo founder burnout | High | Whole project | 9-month timeline already absorbs ~10% buffer; explicit weekly retro; cut scope before pushing nights |
| GST portal API changes mid-build | Medium | Sync worker breakage | Buy via GSP shifts this risk to vendor; monitor `provider_call_log` error rates with alerts |
| Cost runaway on per-call APIs | Medium | Margin erosion | Per-firm cost log + caps; soft-fail with user-visible message at hard cap |
| Mid-size firm demands SOC2 / SAML during sales | Medium | Lost deal | Start SOC2 Type 1 documentation in Phase 4; SAML behind a feature flag — implement only if a deal closes contingent on it |
| Tenancy bug leaks data across firms | Low | Existential | Tenancy middleware audit in Phase 4; CI grep for raw queries without `firm_id`; pgvector queries always include tenant scope |
| Razorpay subscription edge cases (GST changes, plan upgrades) | Medium | Billing pain | Phase 4 budget includes 1w specifically for edge cases; manual override admin tool for first 6 months |

---

## 9. Definition of done — v1.0 launch criteria

A firm signing up at the public URL can, without contacting you:

1. Complete signup, verify email, run guided onboarding.
2. Connect ≥1 GSTIN and ≥1 CIN; see live data within 24 hours.
3. Import clients via CSV.
4. Invite team members with correct roles.
5. Upload a notice PDF and have it OCR'd, classified, deadline-extracted, and a task auto-created with WhatsApp reminder fired.
6. Pay via Razorpay, get a GST-compliant invoice from CAFlow.
7. Generate a Tally Prime XML export for a billing period.
8. Use the AI chat to ask scoped questions about their data.
9. Have their clients log into a portal and upload documents.
10. Install the PWA on a phone, receive push notifications, mark attendance with location.

Operational gates:
- Sentry shows <0.5% request error rate over 7 days at expected load.
- Daily backup tested via a real restore in the prior 30 days.
- Tenancy audit checklist signed off; pen-test (paid, ≥1 vendor) clean.
- Public docs site live; runbook covers top 10 incidents.

---

## 10. Out-of-scope for this design

The following will be addressed in their own design docs when the time comes:
- Native mobile apps
- White-label / reseller program
- Tally direct sync
- E-invoicing / e-way bill generation
- Payroll
- CRM marketing automation
- SOC2 / ISO certification (operational program, not a feature spec)
- SSO / SAML
- Marketplace / app extensions
- Multi-region failover

---

## 11. Open questions for execution

These do not block the spec but must be resolved before the relevant phase starts:

- **Phase 0:** chosen cloud (AWS Mumbai vs Azure India) — pick on cost, free credits, support quality.
- **Phase 0:** error tracking (Sentry self-hosted vs cloud) — likely cloud for solo simplicity.
- **Phase 1:** specific GSP and MCA vendors (criteria in §7).
- **Phase 2:** specific OCR and WhatsApp vendors.
- **Phase 4:** legal/CA review of the GST-compliant invoice template CAFlow issues to firms.
- **Phase 5:** pricing finalisation — ₹1k vs ₹1.5k vs ₹2k per seat; trial length; annual discount.
