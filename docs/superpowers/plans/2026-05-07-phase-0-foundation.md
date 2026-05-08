# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the foundation everything else builds on — integration provider abstraction with cost log, observability, extended CI, and a deployable AWS Mumbai dev environment — so Phases 1–5 can plug in vendors and ship features without retrofitting plumbing.

**Architecture:** Add a new `backend/app/integrations/` package with a `Provider` ABC plus cross-cutting concerns (cost metering, retry-on-reads, circuit breaker) so every external API integration in later phases inherits the same guarantees. Persist every external call to a `provider_call_log` table for per-firm cost reporting. Wire structured logs (structlog) and error capture (Sentry) before any vendor work begins. Extend existing CI with type-check + lint. Stand up Terraform-managed AWS Mumbai dev env so deploys are repeatable from day 1.

**Tech Stack:** FastAPI 0.111+, SQLAlchemy 2.0 async, Alembic, Celery (already in repo), Postgres 16, Redis, structlog, sentry-sdk, pybreaker, tenacity, ruff, mypy, eslint, Terraform, Fly.io (or ECS Fargate). Frontend Next.js 14 + TypeScript.

**Source spec:** `docs/superpowers/specs/2026-05-07-mid-size-sellability-design.md` (§4.1, §4.2, §6 Phase 0)

**Sub-skill recommendation for execution:** `superpowers:test-driven-development` is rigid and applies to all integration-layer tasks. Infra tasks (Terraform, Sentry config) use acceptance-driven verification, not unit tests.

---

## File structure

| File | Purpose | Status |
|---|---|---|
| `backend/app/integrations/__init__.py` | Package marker | New |
| `backend/app/integrations/base.py` | `Provider` ABC, exceptions, decorators | New |
| `backend/app/integrations/_meter.py` | Cost metering decorator | New |
| `backend/app/integrations/_retry.py` | Retry-on-reads decorator | New |
| `backend/app/integrations/_breaker.py` | Circuit breaker per provider | New |
| `backend/app/models/provider_call_log.py` | SQLAlchemy model | New |
| `backend/alembic/versions/20260508_add_provider_call_log.py` | Migration | New |
| `backend/app/api/admin.py` | Admin-only endpoints (call log inspection) | New |
| `backend/app/core/logging.py` | structlog config | New |
| `backend/app/core/sentry.py` | Sentry init helper | New |
| `backend/app/main.py` | Wire logging + Sentry + admin router | Modify |
| `backend/app/api/portal_sync.py` | Mark deprecated, return 410 | Modify |
| `backend/app/api/communication.py` | Mark deprecated, return 410 | Modify |
| `backend/scripts/` (new dir) | Move seed + admin scripts here | New dir |
| `backend/requirements.txt` | Add structlog, sentry-sdk, pybreaker, tenacity, mypy, ruff | Modify |
| `backend/pyproject.toml` | ruff + mypy config | New |
| `backend/tests/integrations/test_base.py` | Provider ABC tests | New |
| `backend/tests/integrations/test_meter.py` | Cost metering tests | New |
| `backend/tests/integrations/test_retry.py` | Retry tests | New |
| `backend/tests/integrations/test_breaker.py` | Circuit breaker tests | New |
| `backend/tests/api/test_admin.py` | Admin endpoint tests | New |
| `frontend/.eslintrc.json` (or extend existing) | ESLint config | Modify/New |
| `frontend/package.json` | Add lint + typecheck scripts | Modify |
| `.github/workflows/ci.yml` | Add lint + typecheck jobs | Modify |
| `.pre-commit-config.yaml` | Hooks: ruff, mypy, eslint, prettier | New |
| `infra/terraform/main.tf` | Provider, backend, locals | New |
| `infra/terraform/network.tf` | VPC, subnets, security groups | New |
| `infra/terraform/data.tf` | RDS Postgres + ElastiCache Redis | New |
| `infra/terraform/secrets.tf` | AWS Secrets Manager skeleton | New |
| `infra/terraform/app.tf` | Fly.io app definition (or ECS task) | New |
| `infra/terraform/variables.tf`, `outputs.tf` | Inputs/outputs | New |
| `infra/README.md` | Deploy instructions | New |
| `fly.toml` (if Fly.io chosen) | App config | New |

---

## Decisions baked into this plan

These are **not** TBD — execute as written.

| Decision | Choice | Reason |
|---|---|---|
| Background worker | **Celery** (not RQ from spec) | Already in `requirements.txt` and `app/core/celery_app.py` exists. Switching costs more than it saves. |
| Deploy target | **Fly.io, Singapore region** | Closest to India (Mumbai not yet in Fly), solo-friendly, single-binary CLI vs ECS complexity. RDS still in AWS Mumbai for data residency. ECS migration deferred until scale demands. |
| Cloud DB | **AWS RDS Postgres 16, Mumbai (`ap-south-1`)** | Spec requires India residency for data; Fly's Postgres add-on is regional but RDS gives mature backup/PITR/HA. |
| Cache/queue | **AWS ElastiCache Redis, Mumbai** | Same residency + ops reasoning. |
| Error tracking | **Sentry SaaS (cloud)** | Self-hosted Sentry is a job; not a Phase 0 fight. |
| Logging | **structlog → stdout JSON → Fly logs (free) for now** | Loki/Grafana deferred to Phase 5 hardening. JSON logs in Fly's log search are enough for solo. |
| Circuit breaker | **`pybreaker`** | Mature, sync + async, simple. |
| Retry library | **`tenacity`** | De facto Python retry lib. |
| Linter | **`ruff`** (replaces flake8/black/isort) | One tool, fast. |
| Type checker | **`mypy --strict` on `app/integrations/`, `app/core/` only initially** | Full repo --strict is a multi-week migration; scope to new code. |
| Pre-commit | **`pre-commit` framework** | Standard. |

---

## Tasks

### Task 1: Repo cleanup — move root-level scripts into `backend/scripts/`

**Why:** `backend/add_priya.py`, `backend/check_users.py`, `backend/sync_db.py`, `frontend/fix_*.py`, `frontend/compact_space*.py`, `frontend/script.py`, `frontend/table_script.py` are one-off scripts polluting the project roots. Moving the keepers and deleting the dead reduces what later tasks have to reason about.

**Files:**
- Create: `backend/scripts/__init__.py` (empty, marker)
- Move: `backend/seed.py`, `backend/seed_massive.py`, `backend/seed_statutory_calendar.py`, `backend/add_priya.py`, `backend/check_users.py`, `backend/sync_db.py` → `backend/scripts/`
- Delete: `frontend/fix_tasks.py`, `frontend/fix_team.py`, `frontend/compact_space.py`, `frontend/compact_space_aggressive.py`, `frontend/script.py`, `frontend/table_script.py`

- [ ] **Step 1.1: Inspect each frontend Python script (≤2 min each) and confirm none are referenced from package.json or docs**

```bash
grep -RIn "fix_tasks\|fix_team\|compact_space\|table_script" --include="*.json" --include="*.md" frontend/ docs/ README.md
```
Expected: no matches. If matches found, update or postpone.

- [ ] **Step 1.2: Create `backend/scripts/` and move backend one-offs**

```bash
mkdir -p backend/scripts
git mv backend/seed.py backend/scripts/seed.py
git mv backend/seed_massive.py backend/scripts/seed_massive.py
git mv backend/seed_statutory_calendar.py backend/scripts/seed_statutory_calendar.py
git mv backend/add_priya.py backend/scripts/add_priya.py
git mv backend/check_users.py backend/scripts/check_users.py
git mv backend/sync_db.py backend/scripts/sync_db.py
touch backend/scripts/__init__.py
```

- [ ] **Step 1.3: Update README references to `python seed.py` → `python -m scripts.seed`**

In `README.md` find every `python seed.py` and replace with `python -m scripts.seed`. Same for any other moved script referenced.

- [ ] **Step 1.4: Verify `python -m scripts.seed --help` (or import) works**

```bash
cd backend && python -c "from scripts import seed"
```
Expected: no ImportError. If `seed.py` uses relative imports that break, fix them by switching to `from app.x import y` (absolute).

- [ ] **Step 1.5: Delete dead frontend scripts**

```bash
git rm frontend/fix_tasks.py frontend/fix_team.py frontend/compact_space.py frontend/compact_space_aggressive.py frontend/script.py frontend/table_script.py
```

- [ ] **Step 1.6: Commit**

```bash
git commit -m "chore: relocate backend one-off scripts to backend/scripts, remove dead frontend scripts"
```

---

### Task 2: Mark `portal_sync.py` and `communication.py` deprecated

**Why:** Spec §3.3 calls these out for replacement in Phase 1/2. Leaving them as no-op stubs that return HTTP 410 prevents anyone (including future-you) from accidentally relying on them. Full deletion happens when their replacement ships.

**Files:**
- Modify: `backend/app/api/portal_sync.py` (50 lines → ~20 lines stub)
- Modify: `backend/app/api/communication.py` (151 lines → ~20 lines stub)

- [ ] **Step 2.1: Read existing `portal_sync.py` to capture any non-trivial logic worth preserving as a comment**

```bash
cat backend/app/api/portal_sync.py
```

- [ ] **Step 2.2: Replace `portal_sync.py` content with a 410 stub**

```python
"""Deprecated stub. Replaced by GSP-backed sync in Phase 1.

See docs/superpowers/specs/2026-05-07-mid-size-sellability-design.md §6 Phase 1.
"""
from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gone(path: str):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="portal_sync is deprecated; replacement ships in Phase 1 (GSP integration).",
    )
```

- [ ] **Step 2.3: Same treatment for `communication.py`**

```python
"""Deprecated stub. Replaced by BSP-backed WhatsApp service in Phase 2.

See docs/superpowers/specs/2026-05-07-mid-size-sellability-design.md §6 Phase 2.
"""
from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gone(path: str):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="communication endpoints deprecated; replacement ships in Phase 2 (WhatsApp BSP).",
    )
```

- [ ] **Step 2.4: Run backend, hit a deprecated endpoint, verify 410**

```bash
cd backend && uvicorn app.main:app --port 8000 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/portal-sync/anything
kill %1
```
Expected: `410`

- [ ] **Step 2.5: Commit**

```bash
git add backend/app/api/portal_sync.py backend/app/api/communication.py
git commit -m "chore: stub portal_sync and communication APIs as 410 pending Phase 1/2 replacements"
```

---

### Task 3: Add new dependencies to `backend/requirements.txt`

**Why:** Tasks 4–11 need libraries that aren't in the project yet. Pinning versions up front avoids "works on my machine."

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 3.1: Append to `backend/requirements.txt`**

```text
structlog>=24.1.0
sentry-sdk[fastapi]>=2.0.0
pybreaker>=1.2.0
tenacity>=9.0.0
ruff>=0.6.0
mypy>=1.11.0
types-python-jose
pre-commit>=3.8.0
```

- [ ] **Step 3.2: Install and verify imports work**

```bash
cd backend && pip install -r requirements.txt
python -c "import structlog, sentry_sdk, pybreaker, tenacity"
```
Expected: no output, exit 0.

- [ ] **Step 3.3: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore: add structlog, sentry, pybreaker, tenacity, ruff, mypy"
```

---

### Task 4: `provider_call_log` SQLAlchemy model + Alembic migration

**Why:** Per spec §4.1, every external API call gets a row here for per-firm cost reporting and runaway detection. This must exist before any provider code can reference it.

**Files:**
- Create: `backend/app/models/provider_call_log.py`
- Modify: `backend/app/main.py` (add to model imports)
- Create: `backend/alembic/versions/20260508_add_provider_call_log.py`
- Create: `backend/tests/models/test_provider_call_log.py`

- [ ] **Step 4.1: Write the failing model test**

`backend/tests/models/test_provider_call_log.py`:
```python
import pytest
from datetime import datetime, timezone
from app.models.provider_call_log import ProviderCallLog


@pytest.mark.asyncio
async def test_provider_call_log_persists(db_session):
    log = ProviderCallLog(
        firm_id=1,
        provider="gsp.masters_india",
        endpoint="returns.status",
        status="ok",
        latency_ms=234,
        cost_paise=150,
        request_id="req-abc-123",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)
    assert log.id is not None
    assert log.provider == "gsp.masters_india"
    assert log.cost_paise == 150
```

> Note: assumes `db_session` fixture exists in `backend/tests/conftest.py`. If it doesn't, check existing tests for the pattern and copy it.

- [ ] **Step 4.2: Run test to confirm it fails**

```bash
cd backend && pytest tests/models/test_provider_call_log.py -v
```
Expected: `ImportError: cannot import name 'ProviderCallLog'`

- [ ] **Step 4.3: Write the model**

`backend/app/models/provider_call_log.py`:
```python
from datetime import datetime, timezone
from sqlalchemy import BigInteger, Column, DateTime, Index, Integer, String, Text
from app.db.base import Base


class ProviderCallLog(Base):
    __tablename__ = "provider_call_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    firm_id = Column(Integer, nullable=True, index=True)  # nullable: some calls (auth ping) lack firm scope
    provider = Column(String(64), nullable=False, index=True)  # e.g. "gsp.masters_india"
    endpoint = Column(String(128), nullable=False)  # e.g. "returns.status"
    status = Column(String(16), nullable=False)  # "ok" | "error" | "timeout" | "circuit_open"
    latency_ms = Column(Integer, nullable=False)
    cost_paise = Column(Integer, nullable=False, default=0)  # store as int paise to avoid float drift
    request_id = Column(String(64), nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    __table_args__ = (
        Index("ix_provider_call_log_firm_provider_created", "firm_id", "provider", "created_at"),
    )
```

- [ ] **Step 4.4: Generate migration**

```bash
cd backend && alembic revision --autogenerate -m "add provider_call_log"
```

Inspect the generated file under `backend/alembic/versions/` — rename it to `20260508_add_provider_call_log.py` if autogen named it differently. Confirm it creates the table + indexes; remove any spurious operations against unrelated tables.

- [ ] **Step 4.5: Wire model into the import block in `main.py`**

In `backend/app/main.py`, locate the `from app.models import (...)` block and add `provider_call_log` to the tuple.

- [ ] **Step 4.6: Apply migration and run test**

```bash
cd backend && alembic upgrade head
pytest tests/models/test_provider_call_log.py -v
```
Expected: PASS.

- [ ] **Step 4.7: Commit**

```bash
git add backend/app/models/provider_call_log.py backend/app/main.py backend/alembic/versions/20260508_add_provider_call_log.py backend/tests/models/test_provider_call_log.py
git commit -m "feat(integrations): add provider_call_log model for per-firm API cost tracking"
```

---

### Task 5: Provider ABC and exception types (TDD)

**Why:** Every concrete provider in Phases 1–3 (GSP, MCA, OCR, WhatsApp, AI, Razorpay) inherits this. Defining it now means later tasks plug in instead of inventing structure.

**Files:**
- Create: `backend/app/integrations/__init__.py` (empty)
- Create: `backend/app/integrations/base.py`
- Create: `backend/tests/integrations/__init__.py` (empty)
- Create: `backend/tests/integrations/test_base.py`

- [ ] **Step 5.1: Write the failing test**

`backend/tests/integrations/test_base.py`:
```python
import pytest
from app.integrations.base import (
    Provider,
    ProviderError,
    ProviderTimeoutError,
    ProviderCircuitOpenError,
    ProviderConfig,
)


class FakeProvider(Provider):
    name = "fake.test"

    async def _ping(self) -> bool:
        return True


def test_provider_requires_name():
    class Unnamed(Provider):
        async def _ping(self) -> bool:
            return True

    with pytest.raises(TypeError, match="name"):
        Unnamed(ProviderConfig(api_key="x"))


def test_provider_config_holds_api_key():
    cfg = ProviderConfig(api_key="secret", base_url="https://api.example.com")
    p = FakeProvider(cfg)
    assert p.config.api_key == "secret"
    assert p.config.base_url == "https://api.example.com"


def test_exception_hierarchy():
    assert issubclass(ProviderTimeoutError, ProviderError)
    assert issubclass(ProviderCircuitOpenError, ProviderError)
```

- [ ] **Step 5.2: Run, confirm fails**

```bash
cd backend && pytest tests/integrations/test_base.py -v
```
Expected: `ImportError`.

- [ ] **Step 5.3: Implement `base.py`**

```python
"""Provider abstraction shared by all external integrations.

Every concrete provider (GSP, MCA, OCR, WhatsApp, AI, payments) subclasses
`Provider` and inherits cost metering, retry-on-reads, and circuit-breaker
behaviour added by decorators in sibling modules.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


class ProviderError(Exception):
    """Base for all provider-side failures."""


class ProviderTimeoutError(ProviderError):
    """The provider did not respond within the configured timeout."""


class ProviderCircuitOpenError(ProviderError):
    """The circuit breaker is open; call short-circuited."""


class ProviderAuthError(ProviderError):
    """Credentials were rejected. Surface to the firm — they need to re-auth."""


class ProviderRateLimitError(ProviderError):
    """The provider rate-limited us. Caller should back off."""


@dataclass
class ProviderConfig:
    api_key: str
    base_url: str | None = None
    timeout_s: float = 30.0
    extra: dict[str, Any] = field(default_factory=dict)


class Provider(ABC):
    """Base class for every external API integration.

    Subclasses MUST set ``name`` (e.g. ``"gsp.masters_india"``) — used as
    the row key in ``provider_call_log`` and for circuit breaker scoping.
    """

    name: str = ""

    def __init__(self, config: ProviderConfig) -> None:
        if not self.name:
            raise TypeError(f"{type(self).__name__} must set class attribute 'name'")
        self.config = config

    @abstractmethod
    async def _ping(self) -> bool:
        """Cheap health check. Used by integration tests and admin status page."""
        ...
```

- [ ] **Step 5.4: Run tests, confirm pass**

```bash
cd backend && pytest tests/integrations/test_base.py -v
```
Expected: 3 PASSED.

- [ ] **Step 5.5: Commit**

```bash
git add backend/app/integrations backend/tests/integrations
git commit -m "feat(integrations): add Provider ABC and exception hierarchy"
```

---

### Task 6: Cost metering decorator (TDD)

**Why:** Every provider call writes a row to `provider_call_log`. A decorator keeps this concern out of every concrete provider method.

**Files:**
- Create: `backend/app/integrations/_meter.py`
- Create: `backend/tests/integrations/test_meter.py`

- [ ] **Step 6.1: Write the failing test**

`backend/tests/integrations/test_meter.py`:
```python
import pytest
from unittest.mock import AsyncMock
from app.integrations._meter import metered
from app.integrations.base import Provider, ProviderConfig, ProviderError


class FakeProvider(Provider):
    name = "fake.test"

    async def _ping(self) -> bool:
        return True

    @metered(endpoint="echo", cost_paise=50)
    async def echo(self, msg: str) -> str:
        return msg

    @metered(endpoint="boom", cost_paise=10)
    async def boom(self) -> None:
        raise ProviderError("expected")


@pytest.mark.asyncio
async def test_metered_writes_ok_row(db_session, monkeypatch):
    rows: list[dict] = []
    async def fake_write(**kw):
        rows.append(kw)
    monkeypatch.setattr("app.integrations._meter._write_log", fake_write)

    p = FakeProvider(ProviderConfig(api_key="x"))
    out = await p.echo("hi", _firm_id=42, _request_id="r1")

    assert out == "hi"
    assert len(rows) == 1
    assert rows[0]["status"] == "ok"
    assert rows[0]["provider"] == "fake.test"
    assert rows[0]["endpoint"] == "echo"
    assert rows[0]["cost_paise"] == 50
    assert rows[0]["firm_id"] == 42
    assert rows[0]["request_id"] == "r1"
    assert rows[0]["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_metered_writes_error_row(monkeypatch):
    rows: list[dict] = []
    async def fake_write(**kw):
        rows.append(kw)
    monkeypatch.setattr("app.integrations._meter._write_log", fake_write)

    p = FakeProvider(ProviderConfig(api_key="x"))
    with pytest.raises(ProviderError):
        await p.boom(_firm_id=42)

    assert len(rows) == 1
    assert rows[0]["status"] == "error"
    assert rows[0]["error_message"] == "expected"
    assert rows[0]["cost_paise"] == 10  # we still log cost on failure if vendor charges
```

- [ ] **Step 6.2: Confirm fails**

```bash
cd backend && pytest tests/integrations/test_meter.py -v
```
Expected: `ImportError`.

- [ ] **Step 6.3: Implement `_meter.py`**

```python
"""Cost metering decorator for Provider methods.

Wraps an async provider method and writes a `provider_call_log` row regardless
of outcome. The decorated method MAY accept ``_firm_id`` and ``_request_id``
kwargs which are stripped before invocation and recorded on the log row.
"""
from __future__ import annotations
import time
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Awaitable, Callable, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal
from app.models.provider_call_log import ProviderCallLog

T = TypeVar("T")


async def _write_log(
    *,
    firm_id: int | None,
    provider: str,
    endpoint: str,
    status: str,
    latency_ms: int,
    cost_paise: int,
    request_id: str | None,
    error_message: str | None,
) -> None:
    async with AsyncSessionLocal() as session:  # type: AsyncSession
        session.add(
            ProviderCallLog(
                firm_id=firm_id,
                provider=provider,
                endpoint=endpoint,
                status=status,
                latency_ms=latency_ms,
                cost_paise=cost_paise,
                request_id=request_id,
                error_message=error_message,
                created_at=datetime.now(timezone.utc),
            )
        )
        await session.commit()


def metered(*, endpoint: str, cost_paise: int = 0) -> Callable:
    """Decorator: writes a provider_call_log row for each invocation.

    Strips ``_firm_id`` and ``_request_id`` from kwargs before calling the
    wrapped method.
    """

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(fn)
        async def wrapper(self, *args: Any, **kwargs: Any) -> T:
            firm_id = kwargs.pop("_firm_id", None)
            request_id = kwargs.pop("_request_id", None)
            t0 = time.perf_counter()
            status = "ok"
            error_message: str | None = None
            try:
                return await fn(self, *args, **kwargs)
            except Exception as e:  # noqa: BLE001 — we re-raise
                status = "error"
                error_message = str(e)[:1000]
                raise
            finally:
                latency_ms = int((time.perf_counter() - t0) * 1000)
                await _write_log(
                    firm_id=firm_id,
                    provider=self.name,
                    endpoint=endpoint,
                    status=status,
                    latency_ms=latency_ms,
                    cost_paise=cost_paise,
                    request_id=request_id,
                    error_message=error_message,
                )

        return wrapper

    return deco
```

- [ ] **Step 6.4: Run tests, confirm pass**

```bash
cd backend && pytest tests/integrations/test_meter.py -v
```
Expected: 2 PASSED.

- [ ] **Step 6.5: Commit**

```bash
git add backend/app/integrations/_meter.py backend/tests/integrations/test_meter.py
git commit -m "feat(integrations): add @metered decorator writing provider_call_log rows"
```

---

### Task 7: Retry-on-reads decorator (TDD)

**Why:** Spec §4.1 — idempotent reads retry with jitter; **writes never auto-retry** because retrying a posted GST return = double-filing disaster.

**Files:**
- Create: `backend/app/integrations/_retry.py`
- Create: `backend/tests/integrations/test_retry.py`

- [ ] **Step 7.1: Write failing test**

`backend/tests/integrations/test_retry.py`:
```python
import pytest
from app.integrations._retry import retry_reads
from app.integrations.base import ProviderTimeoutError, ProviderRateLimitError, ProviderError


@pytest.mark.asyncio
async def test_retries_on_timeout_then_succeeds():
    calls = {"n": 0}

    @retry_reads(max_attempts=3)
    async def fn():
        calls["n"] += 1
        if calls["n"] < 3:
            raise ProviderTimeoutError("nope")
        return "ok"

    assert await fn() == "ok"
    assert calls["n"] == 3


@pytest.mark.asyncio
async def test_retries_on_rate_limit():
    calls = {"n": 0}

    @retry_reads(max_attempts=2)
    async def fn():
        calls["n"] += 1
        if calls["n"] < 2:
            raise ProviderRateLimitError("slow down")
        return "ok"

    assert await fn() == "ok"


@pytest.mark.asyncio
async def test_does_not_retry_on_unknown_error():
    calls = {"n": 0}

    @retry_reads(max_attempts=3)
    async def fn():
        calls["n"] += 1
        raise ProviderError("permanent")

    with pytest.raises(ProviderError):
        await fn()
    assert calls["n"] == 1


@pytest.mark.asyncio
async def test_gives_up_after_max_attempts():
    calls = {"n": 0}

    @retry_reads(max_attempts=3)
    async def fn():
        calls["n"] += 1
        raise ProviderTimeoutError("forever")

    with pytest.raises(ProviderTimeoutError):
        await fn()
    assert calls["n"] == 3
```

- [ ] **Step 7.2: Confirm fails**

```bash
cd backend && pytest tests/integrations/test_retry.py -v
```

- [ ] **Step 7.3: Implement `_retry.py`**

```python
"""Retry decorator for idempotent (read) provider methods.

NEVER apply this to write methods — re-posting an already-accepted GST
return or invoice double-fires real-world side effects.
"""
from __future__ import annotations
from typing import Awaitable, Callable, TypeVar
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)
from app.integrations.base import ProviderTimeoutError, ProviderRateLimitError

T = TypeVar("T")


def retry_reads(*, max_attempts: int = 3, initial_wait: float = 0.5, max_wait: float = 8.0) -> Callable:
    """Retry idempotent provider reads on transient failures only."""

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        return retry(
            reraise=True,
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential_jitter(initial=initial_wait, max=max_wait),
            retry=retry_if_exception_type((ProviderTimeoutError, ProviderRateLimitError)),
        )(fn)

    return deco
```

- [ ] **Step 7.4: Pass**

```bash
cd backend && pytest tests/integrations/test_retry.py -v
```
Expected: 4 PASSED. (Test runtime ~5s due to backoff — that's fine.)

- [ ] **Step 7.5: Commit**

```bash
git add backend/app/integrations/_retry.py backend/tests/integrations/test_retry.py
git commit -m "feat(integrations): add @retry_reads decorator using tenacity (timeouts + rate-limits only)"
```

---

### Task 8: Circuit breaker decorator (TDD)

**Why:** Spec §4.1 — when a provider fails N times, short-circuit M minutes so the broken upstream doesn't wedge the request thread pool.

**Files:**
- Create: `backend/app/integrations/_breaker.py`
- Create: `backend/tests/integrations/test_breaker.py`

- [ ] **Step 8.1: Write failing test**

`backend/tests/integrations/test_breaker.py`:
```python
import pytest
import asyncio
from app.integrations._breaker import breaker, get_breaker
from app.integrations.base import ProviderCircuitOpenError, ProviderError


@pytest.fixture(autouse=True)
def reset_breakers():
    from app.integrations._breaker import _BREAKERS
    _BREAKERS.clear()
    yield
    _BREAKERS.clear()


@pytest.mark.asyncio
async def test_breaker_opens_after_threshold():
    @breaker(name="t1", fail_max=2, reset_timeout=60)
    async def boom():
        raise ProviderError("boom")

    with pytest.raises(ProviderError):
        await boom()
    with pytest.raises(ProviderError):
        await boom()
    # third call: circuit open
    with pytest.raises(ProviderCircuitOpenError):
        await boom()


@pytest.mark.asyncio
async def test_breaker_independent_per_name():
    @breaker(name="a", fail_max=1, reset_timeout=60)
    async def a():
        raise ProviderError("a")

    @breaker(name="b", fail_max=5, reset_timeout=60)
    async def b():
        return "ok"

    with pytest.raises(ProviderError):
        await a()
    with pytest.raises(ProviderCircuitOpenError):
        await a()  # opens
    assert await b() == "ok"  # b unaffected
```

- [ ] **Step 8.2: Confirm fails**

```bash
cd backend && pytest tests/integrations/test_breaker.py -v
```

- [ ] **Step 8.3: Implement `_breaker.py`**

```python
"""Circuit-breaker decorator scoped per provider name.

Once `fail_max` failures occur in `reset_timeout` seconds, further calls
fast-fail with `ProviderCircuitOpenError` until the timeout elapses.
"""
from __future__ import annotations
from functools import wraps
from typing import Awaitable, Callable, TypeVar

import pybreaker
from app.integrations.base import ProviderCircuitOpenError

T = TypeVar("T")

_BREAKERS: dict[str, pybreaker.CircuitBreaker] = {}


def get_breaker(name: str, *, fail_max: int = 5, reset_timeout: int = 60) -> pybreaker.CircuitBreaker:
    if name not in _BREAKERS:
        _BREAKERS[name] = pybreaker.CircuitBreaker(
            fail_max=fail_max,
            reset_timeout=reset_timeout,
            name=name,
        )
    return _BREAKERS[name]


def breaker(*, name: str, fail_max: int = 5, reset_timeout: int = 60) -> Callable:
    """Decorator: scope an async function under a named circuit breaker."""
    cb = get_breaker(name, fail_max=fail_max, reset_timeout=reset_timeout)

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            try:
                return await cb.call_async(fn, *args, **kwargs)
            except pybreaker.CircuitBreakerError as e:
                raise ProviderCircuitOpenError(str(e)) from e

        return wrapper

    return deco
```

- [ ] **Step 8.4: Pass**

```bash
cd backend && pytest tests/integrations/test_breaker.py -v
```
Expected: 2 PASSED.

- [ ] **Step 8.5: Commit**

```bash
git add backend/app/integrations/_breaker.py backend/tests/integrations/test_breaker.py
git commit -m "feat(integrations): add @breaker decorator (pybreaker, async)"
```

---

### Task 9: Admin endpoint to inspect `provider_call_log` (TDD)

**Why:** Without a way to read the log, you'll never spot cost runaway or chronically-failing providers. Lightweight admin route, gated to firm-owner role.

**Files:**
- Create: `backend/app/api/admin.py`
- Modify: `backend/app/main.py` (register router)
- Create: `backend/tests/api/test_admin.py`

- [ ] **Step 9.1: Write failing test**

`backend/tests/api/test_admin.py`:
```python
import pytest
from datetime import datetime, timezone
from app.models.provider_call_log import ProviderCallLog


@pytest.mark.asyncio
async def test_admin_provider_calls_returns_recent_rows(client, admin_token, db_session):
    db_session.add(ProviderCallLog(
        firm_id=1, provider="gsp.x", endpoint="ping", status="ok",
        latency_ms=10, cost_paise=5, created_at=datetime.now(timezone.utc),
    ))
    await db_session.commit()

    r = await client.get(
        "/api/admin/provider-calls?limit=10",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(row["provider"] == "gsp.x" for row in data)


@pytest.mark.asyncio
async def test_admin_endpoint_rejects_non_admin(client, employee_token):
    r = await client.get(
        "/api/admin/provider-calls",
        headers={"Authorization": f"Bearer {employee_token}"},
    )
    assert r.status_code == 403
```

> Reuse existing fixtures (`client`, `admin_token`, `employee_token`, `db_session`). Inspect `backend/tests/conftest.py` first; if any fixture is missing, mirror what existing API tests do (e.g. `tests/api/test_clients.py`).

- [ ] **Step 9.2: Confirm fails**

```bash
cd backend && pytest tests/api/test_admin.py -v
```

- [ ] **Step 9.3: Implement admin router**

`backend/app/api/admin.py`:
```python
"""Admin-only endpoints for ops visibility (per-firm cost log, system status).

All routes require role >= 'owner'. Surfaced under /api/admin.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.provider_call_log import ProviderCallLog
from app.models.user import User

router = APIRouter()


def _require_admin(user: User) -> None:
    role = (getattr(user, "role", None) or "").lower()
    if role not in {"owner", "admin"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin role required")


@router.get("/provider-calls")
async def list_provider_calls(
    limit: int = Query(100, le=1000),
    provider: str | None = None,
    firm_id: int | None = None,
    since: datetime | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    _require_admin(user)
    stmt = select(ProviderCallLog).order_by(ProviderCallLog.created_at.desc()).limit(limit)
    if provider:
        stmt = stmt.where(ProviderCallLog.provider == provider)
    if firm_id is not None:
        stmt = stmt.where(ProviderCallLog.firm_id == firm_id)
    if since is not None:
        stmt = stmt.where(ProviderCallLog.created_at >= since)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "firm_id": r.firm_id,
            "provider": r.provider,
            "endpoint": r.endpoint,
            "status": r.status,
            "latency_ms": r.latency_ms,
            "cost_paise": r.cost_paise,
            "request_id": r.request_id,
            "error_message": r.error_message,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
```

- [ ] **Step 9.4: Register router in `main.py`**

In `backend/app/main.py`, add to the API import block:
```python
from app.api import (..., admin)
```
And after the existing `include_router` calls:
```python
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
```

> If `get_current_user` / `get_db` import paths differ in your codebase, look at any existing API file (e.g. `app/api/clients.py`) and mirror its imports.

- [ ] **Step 9.5: Pass**

```bash
cd backend && pytest tests/api/test_admin.py -v
```
Expected: 2 PASSED.

- [ ] **Step 9.6: Commit**

```bash
git add backend/app/api/admin.py backend/app/main.py backend/tests/api/test_admin.py
git commit -m "feat(admin): add GET /api/admin/provider-calls"
```

---

### Task 10: structlog wiring

**Why:** Switching to structured JSON logs once now beats migrating later when there are 50 modules calling stdlib `logging`. Request correlation IDs make debugging multi-service issues tractable.

**Files:**
- Create: `backend/app/core/logging.py`
- Modify: `backend/app/main.py` (call `configure_logging()` early, add request-id middleware)

- [ ] **Step 10.1: Write `backend/app/core/logging.py`**

```python
"""structlog configuration. Call configure_logging() before app startup."""
from __future__ import annotations
import logging
import sys
import structlog


def configure_logging(level: str = "INFO") -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=shared_processors + [structlog.processors.JSONRenderer()],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, level)),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Pipe stdlib logging through structlog so libraries (uvicorn, sqlalchemy) format consistently.
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            processors=[structlog.processors.JSONRenderer()],
            foreign_pre_chain=shared_processors,
        )
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
```

- [ ] **Step 10.2: Add request-ID middleware in `main.py`**

In `backend/app/main.py`, near the top after imports:
```python
import uuid
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

from app.core.logging import configure_logging

configure_logging(level=settings.LOG_LEVEL if hasattr(settings, "LOG_LEVEL") else "INFO")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        rid = request.headers.get("x-request-id") or str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=rid, path=request.url.path, method=request.method)
        response = await call_next(request)
        response.headers["x-request-id"] = rid
        return response
```
And register the middleware after `CORSMiddleware`:
```python
app.add_middleware(RequestIdMiddleware)
```

- [ ] **Step 10.3: Sanity check — run server, hit endpoint, verify JSON log on stdout includes `request_id`**

```bash
cd backend && uvicorn app.main:app --port 8000 --no-access-log &
sleep 3
curl -s -H "x-request-id: my-trace-1" http://localhost:8000/docs > /dev/null
kill %1
```
Expected: log line on stdout is JSON and contains `"request_id": "my-trace-1"`.

- [ ] **Step 10.4: Commit**

```bash
git add backend/app/core/logging.py backend/app/main.py
git commit -m "feat(observability): structlog JSON logging with request-id correlation"
```

---

### Task 11: Sentry integration

**Why:** Solo dev cannot babysit error logs. Sentry tells you when the prod env is on fire. Wire it before any real user touches the system.

**Files:**
- Create: `backend/app/core/sentry.py`
- Modify: `backend/app/main.py` (init early)
- Modify: `backend/.env.example` (add `SENTRY_DSN`)

- [ ] **Step 11.1: Write `backend/app/core/sentry.py`**

```python
"""Sentry init helper. No-op when SENTRY_DSN env var is empty."""
from __future__ import annotations
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration


def init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=os.getenv("APP_ENV", "dev"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.0")),
        send_default_pii=False,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    )
```

- [ ] **Step 11.2: Init in `main.py` before app construction**

```python
from app.core.sentry import init_sentry

init_sentry()
```
Place this after `configure_logging()`.

- [ ] **Step 11.3: Add to `backend/.env.example`**

```env
SENTRY_DSN=
APP_ENV=dev
SENTRY_TRACES_SAMPLE_RATE=0.1
```

- [ ] **Step 11.4: Manual smoke**

Set `SENTRY_DSN` in your shell to a Sentry project DSN, run the server, hit a route that raises (add a temporary `/debug-sentry` raising `RuntimeError`, then remove it). Confirm event appears in Sentry within ~30s.

- [ ] **Step 11.5: Commit**

```bash
git add backend/app/core/sentry.py backend/app/main.py backend/.env.example
git commit -m "feat(observability): Sentry integration with FastAPI + SQLAlchemy traces"
```

---

### Task 12: Backend lint + typecheck — `pyproject.toml` + ruff/mypy run

**Why:** Without lint/typecheck in CI, the code degrades. Configure once, enforce in Task 14.

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/mypy.ini` (or section in pyproject)

- [ ] **Step 12.1: Write `backend/pyproject.toml`**

```toml
[tool.ruff]
line-length = 110
target-version = "py311"
extend-exclude = ["alembic/versions", "venv", "venv_linux", "scripts"]

[tool.ruff.lint]
select = ["E", "F", "W", "I", "B", "UP", "C4", "SIM", "RUF"]
ignore = ["E501"]  # line length handled by formatter

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
python_version = "3.11"
strict = false
files = ["app/integrations", "app/core/logging.py", "app/core/sentry.py"]
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "app.integrations.*"
strict = true
```

- [ ] **Step 12.2: Run locally and fix any first-pass findings**

```bash
cd backend && ruff check . && ruff format --check .
mypy
```

If ruff or mypy flags issues in `app/integrations/` (the new code), fix them. Issues elsewhere can be ignored at this stage — scope creep risk.

- [ ] **Step 12.3: Commit**

```bash
git add backend/pyproject.toml
git commit -m "chore(backend): ruff + mypy config (strict on app/integrations)"
```

---

### Task 13: Frontend lint + typecheck scripts

**Why:** Same reasoning as backend.

**Files:**
- Modify: `frontend/package.json`
- Verify: `frontend/.eslintrc.json` (or `eslint.config.mjs`) exists

- [ ] **Step 13.1: Inspect current `frontend/package.json` scripts**

```bash
cat frontend/package.json | python -c "import json,sys; print(json.load(sys.stdin).get('scripts', {}))"
```

- [ ] **Step 13.2: Add scripts if missing**

In `frontend/package.json`, ensure the `"scripts"` object contains:
```json
"lint": "next lint",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 13.3: Run locally**

```bash
cd frontend && npm run lint && npm run typecheck
```

If errors exist, **do not** mass-fix in this task — capture them in a follow-up issue / TODO list. Goal: `lint` and `typecheck` exit 0 for unchanged files. If too many errors, downgrade ESLint config to warn-only for the failing rules so CI is green; tighten incrementally in later phases.

- [ ] **Step 13.4: Commit**

```bash
git add frontend/package.json
git commit -m "chore(frontend): add lint and typecheck npm scripts"
```

---

### Task 14: Extend CI with lint + typecheck jobs

**Why:** Land tasks 12+13 in CI so regressions don't sneak in.

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 14.1: Add backend lint/typecheck steps**

In `.github/workflows/ci.yml`, in the existing `backend-test` job, add steps **before** "Run Pytest":
```yaml
    - name: Ruff
      working-directory: ./backend
      run: |
        ruff check .
        ruff format --check .

    - name: mypy
      working-directory: ./backend
      run: mypy
```

- [ ] **Step 14.2: Add frontend lint + typecheck steps**

In the `frontend-test` job, add **before** "Run Jest":
```yaml
    - name: ESLint
      working-directory: ./frontend
      run: npm run lint

    - name: TypeScript
      working-directory: ./frontend
      run: npm run typecheck
```

- [ ] **Step 14.3: Push and verify CI green**

```bash
git checkout -b ci/extend-checks
git add .github/workflows/ci.yml
git commit -m "ci: add ruff, mypy, eslint, tsc to pipeline"
git push -u origin ci/extend-checks
```

Watch the run on GitHub. If it fails on existing-code issues, fix or relax rules until green. Merge once green.

---

### Task 15: Pre-commit hooks

**Why:** Catch lint failures before push. Saves CI cycles and keeps the lint queue green.

**Files:**
- Create: `.pre-commit-config.yaml`

- [ ] **Step 15.1: Write `.pre-commit-config.yaml`**

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff
        args: [--fix]
        files: ^backend/
      - id: ruff-format
        files: ^backend/

  - repo: local
    hooks:
      - id: frontend-lint
        name: frontend eslint
        language: system
        files: ^frontend/.+\.(ts|tsx|js|jsx)$
        entry: bash -c 'cd frontend && npx eslint --fix --max-warnings 0 "$@"' --
```

- [ ] **Step 15.2: Install hooks locally**

```bash
pre-commit install
pre-commit run --all-files
```

Fix any auto-fixable issues; commit them.

- [ ] **Step 15.3: Commit**

```bash
git add .pre-commit-config.yaml
git commit -m "chore: add pre-commit hooks (ruff + eslint)"
```

---

### Task 16: Terraform skeleton — provider, networking, RDS, Redis

**Why:** Phase 0 milestone is "deploys cleanly to a dev environment in AWS Mumbai." Terraform makes that repeatable.

**Files:**
- Create: `infra/terraform/main.tf`
- Create: `infra/terraform/network.tf`
- Create: `infra/terraform/data.tf`
- Create: `infra/terraform/secrets.tf`
- Create: `infra/terraform/variables.tf`
- Create: `infra/terraform/outputs.tf`
- Create: `infra/README.md`
- Create: `infra/terraform/.gitignore` (excludes `.terraform/`, `*.tfstate*`, `*.tfvars`)

> This task is **not TDD**. Verification is `terraform plan` succeeding and `terraform apply` producing reachable RDS + Redis endpoints.

- [ ] **Step 16.1: `infra/terraform/main.tf`**

```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.50" }
  }
  backend "s3" {
    # bucket, key, region set via -backend-config or terraform.tfvars
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project = "caflow"
      Env     = var.env
      Owner   = "vinay"
    }
  }
}
```

- [ ] **Step 16.2: `variables.tf`**

```hcl
variable "aws_region"  { default = "ap-south-1" }
variable "env"         { default = "dev" }
variable "vpc_cidr"    { default = "10.20.0.0/16" }
variable "db_password" {
  sensitive = true
}
```

- [ ] **Step 16.3: `network.tf` — minimal VPC for RDS + ElastiCache**

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "caflow-${var.env}" }
}

data "aws_availability_zones" "available" { state = "available" }

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "caflow-${var.env}-private-${count.index}" }
}

resource "aws_db_subnet_group" "main" {
  name       = "caflow-${var.env}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "caflow-${var.env}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "data" {
  name   = "caflow-${var.env}-data"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # tighten in Task 17 once Fly egress IPs are known
  }
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

> Note: opening 0.0.0.0/0 to data ports is a temporary expedient to unblock Fly→RDS connectivity. **Task 17 must replace these CIDR rules with Fly's egress IPs.** This is called out explicitly in Task 17.

- [ ] **Step 16.4: `data.tf` — RDS + ElastiCache**

```hcl
resource "aws_db_instance" "main" {
  identifier              = "caflow-${var.env}"
  engine                  = "postgres"
  engine_version          = "16.3"
  instance_class          = "db.t4g.micro"
  allocated_storage       = 20
  storage_encrypted       = true
  db_name                 = "caflow"
  username                = "caflow"
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.data.id]
  publicly_accessible     = true   # dev only — flip for prod env
  backup_retention_period = 7
  skip_final_snapshot     = true
  apply_immediately       = true
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "caflow-${var.env}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.1"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.data.id]
}
```

- [ ] **Step 16.5: `outputs.tf`**

```hcl
output "db_endpoint"     { value = aws_db_instance.main.address }
output "redis_endpoint"  { value = aws_elasticache_cluster.main.cache_nodes[0].address }
output "vpc_id"          { value = aws_vpc.main.id }
```

- [ ] **Step 16.6: `secrets.tf` (skeleton — populated as integrations land)**

```hcl
resource "aws_secretsmanager_secret" "app" {
  name                    = "caflow/${var.env}/app"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    SECRET_KEY    = "rotate-me"
    SENTRY_DSN    = ""
    GROQ_API_KEY  = ""
  })
  lifecycle { ignore_changes = [secret_string] }  # operators rotate via console
}
```

- [ ] **Step 16.7: `infra/README.md`**

```markdown
# CAFlow Infrastructure

## Bootstrap (one-time, manual)

1. Create S3 bucket for Terraform state: `caflow-tfstate-<your-account-id>` in `ap-south-1`. Enable versioning + encryption.
2. Set:
   ```
   export TF_VAR_db_password=<generate-strong>
   ```

## Plan / apply

```
cd infra/terraform
terraform init -backend-config="bucket=caflow-tfstate-<id>" -backend-config="key=dev/terraform.tfstate" -backend-config="region=ap-south-1"
terraform plan -var env=dev
terraform apply -var env=dev
```

Outputs `db_endpoint` and `redis_endpoint` go into Fly secrets in Task 17.
```

- [ ] **Step 16.8: `terraform plan` succeeds**

```bash
cd infra/terraform
terraform init -backend-config=...   # see README
TF_VAR_db_password=$(openssl rand -base64 32) terraform plan -var env=dev
```
Expected: plan completes, ~15 resources to create, no errors.

- [ ] **Step 16.9: Commit**

```bash
git add infra/
git commit -m "infra: terraform skeleton for AWS Mumbai dev (VPC, RDS Postgres 16, ElastiCache Redis)"
```

---

### Task 17: Fly.io app deployment

**Why:** Phase 0 milestone — main branch deploys end-to-end with telemetry. Fly handles container build + run + secrets + DNS for one CLI command.

**Files:**
- Create: `fly.toml`
- Create: `backend/Dockerfile.fly` (or extend existing `backend/Dockerfile`)

- [ ] **Step 17.1: Inspect existing `backend/Dockerfile`**

```bash
cat backend/Dockerfile
```

If it already runs uvicorn against `app.main:app` on a configurable port, reuse it. Otherwise add:

```dockerfile
# At end of file
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 17.2: Create `fly.toml` at repo root**

```toml
app = "caflow-dev"
primary_region = "sin"  # Singapore — closest to India until Fly Mumbai

[build]
  dockerfile = "backend/Dockerfile"

[env]
  APP_ENV = "dev"
  PORT = "8000"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory = "512mb"
```

- [ ] **Step 17.3: Bootstrap Fly app + secrets**

```bash
fly launch --no-deploy --copy-config --name caflow-dev
fly secrets set \
  DATABASE_URL="postgresql+asyncpg://caflow:$TF_VAR_db_password@<db_endpoint>:5432/caflow" \
  REDIS_URL="redis://<redis_endpoint>:6379/0" \
  SECRET_KEY="$(openssl rand -base64 48)" \
  SENTRY_DSN="<dsn>"
```

- [ ] **Step 17.4: Tighten RDS security group to Fly egress IPs**

```bash
fly ips list  # gets v4 IPs of the app
```

Edit `infra/terraform/network.tf`: replace `cidr_blocks = ["0.0.0.0/0"]` on the data SG ingress rules with the Fly egress IPs (each as `/32`). Run `terraform apply`.

- [ ] **Step 17.5: Deploy and verify**

```bash
fly deploy
fly logs    # watch until "Application startup complete"
curl https://caflow-dev.fly.dev/docs
```
Expected: Swagger UI loads. Sentry receives a test event when you trip a deliberate error.

- [ ] **Step 17.6: Commit**

```bash
git add fly.toml backend/Dockerfile infra/terraform/network.tf
git commit -m "infra: fly.io dev deploy targeting AWS Mumbai data plane"
```

---

### Task 18: Phase 0 milestone verification

**Why:** Don't declare Phase 0 done by vibes. Run the checklist below and only then move on.

- [ ] **Step 18.1: Verify each item**

```bash
# 1. Tests green
cd backend && pytest -v && cd ..

# 2. Lint + typecheck green (locally — CI also enforces)
cd backend && ruff check . && ruff format --check . && mypy && cd ..
cd frontend && npm run lint && npm run typecheck && cd ..

# 3. CI green on main
gh run list --branch main --limit 5

# 4. Migrations apply cleanly
cd backend && alembic upgrade head && cd ..

# 5. Provider call log table populated by a smoke test
cd backend && python -c "
import asyncio
from app.integrations.base import Provider, ProviderConfig
from app.integrations._meter import metered

class Smoke(Provider):
    name = 'smoke.test'
    async def _ping(self): return True
    @metered(endpoint='ping', cost_paise=0)
    async def ping(self): return await self._ping()

asyncio.run(Smoke(ProviderConfig(api_key='x')).ping(_firm_id=None))
print('smoke ok')
" && cd ..

# 6. Fly deploy reachable
curl -s -o /dev/null -w "%{http_code}\n" https://caflow-dev.fly.dev/docs

# 7. Sentry got a test event (visual check in dashboard)

# 8. Admin endpoint returns the smoke row
# Hit GET /api/admin/provider-calls?provider=smoke.test with an admin token
```

- [ ] **Step 18.2: Tag the commit**

```bash
git tag -a phase-0-complete -m "Phase 0: foundation done — integrations skeleton, observability, CI, Mumbai dev env"
git push --tags
```

- [ ] **Step 18.3: Open issue / note for Phase 1 kickoff**

Capture in your tracker: "Phase 1 starts. Evaluate 2 GSPs (Masters India, IRIS) against §7 checklist; sign sandbox agreements only."

---

## Self-review

**Spec coverage** (against §6 Phase 0 of the spec):
- ✅ Code audit: portal_sync, communication, scaffold modules → Tasks 1, 2
- ✅ Integration skeleton with circuit breaker, retry, cost log → Tasks 5–8
- ✅ provider_call_log table + admin view → Tasks 4, 9
- ✅ Sentry, structlog wired up → Tasks 10, 11
- ⚠️ Loki/Grafana — deferred per §1 decisions (Fly logs sufficient for now). Not a gap.
- ✅ AWS Mumbai + Terraform → Tasks 16, 17
- ✅ CI green: typecheck, lint, pytest, frontend tests → Tasks 12–14
- ✅ Demoable milestone: deployable dev env with telemetry → Task 18

**Placeholder scan:** No "TBD" / "implement later" / vague handwaving. The two pieces left to operator action — Sentry DSN provisioning and Fly egress IP discovery — are explicitly steps with commands.

**Type/symbol consistency:** `Provider`, `ProviderConfig`, `ProviderError`, `ProviderTimeoutError`, `ProviderRateLimitError`, `ProviderCircuitOpenError`, `ProviderAuthError` defined in Task 5 are the names referenced in Tasks 6–8. `ProviderCallLog` model fields match across model definition (Task 4), `_meter._write_log` (Task 6), and admin endpoint serialization (Task 9). `metered` accepts `endpoint=` and `cost_paise=` consistently. `breaker` accepts `name=`, `fail_max=`, `reset_timeout=` consistently.

**Known sharp edges:**
- Task 9 admin role check uses `user.role`. If your `User` model uses a many-to-many roles relation instead, adapt the `_require_admin` check during execution.
- Task 4 migration assumes Alembic autogenerate works. If `Base.metadata` is missing the new model at autogen time, the import in `main.py` (Step 4.5) must be applied **before** running `alembic revision --autogenerate`. Order matters.
- Task 16 opens RDS to 0.0.0.0/0 temporarily — Task 17 explicitly tightens this. Don't merge an env to "prod" tier with this open.

---

## Plan complete

Plan saved to `docs/superpowers/plans/2026-05-07-phase-0-foundation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session with checkpoints for review.

**Which approach?**
