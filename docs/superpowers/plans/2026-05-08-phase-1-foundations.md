# Phase 1 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land everything vendor-agnostic for GSP + MCA + Tally — provider ABCs, mock impls, vault extension for per-firm API credentials, Celery sync workers, compliance/notice auto-upsert from sync results, sync UX in the compliance pages, and Tally Prime XML export. After this plan, plugging in a concrete vendor (Masters India / IRIS / Probe42) is a single small follow-up plan.

**Architecture:** Build on Phase 0's `Provider` ABC. Add `GSPProvider` and `MCAProvider` ABCs in `backend/app/integrations/`, each with mock + (later) concrete vendor classes. Sync workers run via Celery beat — one nightly task per firm, iterates the firm's GSTINs / CINs, calls the provider through the metered/retry/breaker decorators, upserts results into existing `compliance` and `notice` tables. Vault extends with a `FirmProviderCredential` model holding Fernet-encrypted API keys scoped per firm + provider. Tally export is an orthogonal service — read invoices, emit Tally Prime XML, expose a bulk-download endpoint.

**Tech Stack:** Existing — FastAPI, async SQLAlchemy 2.0, Celery + Redis, Fernet (cryptography lib), Postgres 16, Next.js 14. No new dependencies.

**Source spec:** `docs/superpowers/specs/2026-05-07-mid-size-sellability-design.md` §6 Phase 1, §4.1.
**Phase 0 (foundation):** complete — see `docs/superpowers/plans/2026-05-07-phase-0-foundation.md`.

**Out of scope (deferred to Phase 1B):**
- Concrete `MastersIndiaGspProvider` / `IrisGspProvider` / `Probe42McaProvider` / etc. — pick after sandbox evaluation.
- Actual nightly sync running against real GSTNs in production — needs vendor credentials.

---

## File structure

| File | Purpose | Status |
|---|---|---|
| `backend/app/integrations/gsp/__init__.py` | Package marker | New |
| `backend/app/integrations/gsp/base.py` | `GSPProvider` ABC + DTOs | New |
| `backend/app/integrations/gsp/mock.py` | `MockGspProvider` with fixture-based responses | New |
| `backend/app/integrations/mca/__init__.py` | Package marker | New |
| `backend/app/integrations/mca/base.py` | `MCAProvider` ABC + DTOs | New |
| `backend/app/integrations/mca/mock.py` | `MockMcaProvider` with fixture-based responses | New |
| `backend/app/models/firm_provider_credential.py` | Fernet-encrypted per-firm API keys | New |
| `backend/alembic/versions/20260512_add_firm_provider_credentials.py` | Migration | New |
| `backend/app/services/credentials.py` | Encrypt/decrypt helpers, lookup by firm + provider | New |
| `backend/app/services/sync/__init__.py` | Package marker | New |
| `backend/app/services/sync/gst.py` | `sync_gst_for_firm(firm_id, provider)` orchestrator | New |
| `backend/app/services/sync/mca.py` | `sync_mca_for_firm(firm_id, provider)` orchestrator | New |
| `backend/app/services/sync/upsert.py` | Idempotent upsert of compliance/notice rows from sync DTOs | New |
| `backend/app/workers/tasks.py` | Add `nightly_gst_sync` + `nightly_mca_sync` Celery tasks | Modify |
| `backend/app/core/celery_app.py` | Add beat schedule entries | Modify |
| `backend/app/api/sync.py` | `POST /api/sync/gst/{firm_id}`, `POST /api/sync/mca/{firm_id}` (manual triggers) | New |
| `backend/app/api/portal_sync.py` | Replace 410 stub with redirect to `/api/sync/*` (legacy URL support) | Modify |
| `backend/app/main.py` | Register sync router, FirmProviderCredential model | Modify |
| `backend/app/services/tally_export/__init__.py` | Package marker | New |
| `backend/app/services/tally_export/voucher.py` | Map invoice → Tally Prime XML voucher | New |
| `backend/app/services/tally_export/bundle.py` | Period-range query → list of vouchers → zip | New |
| `backend/app/api/tally.py` | `GET /api/tally/export?from=...&to=...` | New |
| `backend/scripts/vendor_spike.py` | Sandbox spike runner — drop in any GSPProvider impl, hit each method against vendor sandbox | New |
| `backend/tests/integrations/test_gsp_base.py` | ABC contract tests | New |
| `backend/tests/integrations/test_gsp_mock.py` | Mock provider behaviour tests | New |
| `backend/tests/integrations/test_mca_base.py` | ABC contract tests | New |
| `backend/tests/integrations/test_mca_mock.py` | Mock provider behaviour tests | New |
| `backend/tests/services/test_sync_upsert.py` | Idempotent upsert tests | New |
| `backend/tests/services/test_credentials.py` | Encrypt/decrypt round-trip | New |
| `backend/tests/services/test_tally_voucher.py` | Invoice → XML transform | New |
| `frontend/app/(dashboard)/compliance/_components/SyncBanner.tsx` | "Last synced 12 min ago — Sync now" UI | New |
| `frontend/app/(dashboard)/compliance/_components/SyncTrigger.tsx` | Manual trigger button + status modal | New |
| `frontend/app/(dashboard)/compliance/page.tsx` | Wire SyncBanner + SyncTrigger | Modify |
| `frontend/app/(dashboard)/billing/_components/TallyExportButton.tsx` | Period-range picker + download | New |
| `frontend/app/(dashboard)/billing/page.tsx` | Add Tally export button | Modify |
| `frontend/lib/api.ts` | Add `triggerGspSync`, `triggerMcaSync`, `getTallyExport` methods | Modify |

---

## Decisions baked into this plan

| Decision | Choice | Reason |
|---|---|---|
| Per-firm API key storage | New `firm_provider_credentials` table, Fernet-encrypted | Existing `EncryptedCredential` is per-client (portal logins). Firm-level provider creds (our GSP API key, MCA API key) are a different entity — different scope, different lifecycle. |
| Fernet key | Reuse `settings.FERNET_KEY` already used by `app/core/crypto.py` | Single key rotation surface. If `crypto.py` doesn't expose what we need, extend it — don't fork. |
| Compliance dedup | Upsert by `(firm_id, client_id, type, period)` — natural key | Re-running sync should not duplicate the same return; `period` like "Q1 FY2024-25" is unique per type per client. |
| Notice dedup | Upsert by `(firm_id, client_id, source_ref)` where `source_ref` is the GSP-provided notice ID | GSP gives stable IDs for notices; use them. |
| Sync cadence | Celery beat: nightly at 02:00 IST per firm | Off-peak for GSTN portal, predictable for users. Manual trigger always available. |
| Sync isolation | One Celery task per firm (not per GSTIN) | Lets us serialize cost log writes per firm, easier rate-limit accounting, simpler to retry whole-firm. |
| Tally output format | Tally Prime XML (`<TALLYMESSAGE>` envelope) | De facto standard, accepts via Import Data. Tally ERP 9 XML is largely compatible. |
| Provider DTOs | Pydantic v2 models, NOT raw dicts | Type safety across boundaries; provider authors get IDE help. |
| Frontend sync UI | Two components: passive `SyncBanner` (status) + active `SyncTrigger` (button + progress modal) | Separation of concerns; Banner shown on every compliance page, Trigger only on the dashboard. |

---

## Tasks

### Task 1: `firm_provider_credentials` model + migration

**Why:** Phases 1 onward each integrate a third-party API. Each integration needs an API key. Storing them encrypted, scoped per firm, in a dedicated table avoids polluting other models.

**Files:**
- Create: `backend/app/models/firm_provider_credential.py`
- Create: `backend/alembic/versions/20260512_add_firm_provider_credentials.py`
- Modify: `backend/app/main.py` (add to model imports)

- [ ] **Step 1.1: Find current Alembic head**

```bash
cd backend && grep -H "^revision\|^down_revision" alembic/versions/*.py | grep "^[^:]*:revision"
```

The new migration's `down_revision` must point at the most recent revision in the chain. Phase 0 added `add_provider_call_log`; that should be the head unless something newer landed.

- [ ] **Step 1.2: Write the model**

`backend/app/models/firm_provider_credential.py`:
```python
"""Per-firm encrypted credentials for external API providers (GSP, MCA, OCR, etc.).

Distinct from app.models.vault.EncryptedCredential — that holds per-client
portal logins (Income Tax / GST / MCA portal usernames+passwords). This holds
firm-level API keys we use to call our integrations.
"""
import uuid

from sqlalchemy import Column, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, TimestampMixin


class FirmProviderCredential(Base, TimestampMixin):
    __tablename__ = "firm_provider_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(
        UUID(as_uuid=True),
        ForeignKey("firms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # e.g. "gsp.masters_india", "mca.probe42", "ocr.mindee"
    provider = Column(String(64), nullable=False)
    # The Fernet-encrypted JSON blob. Shape is provider-specific
    # (api_key, client_id, client_secret, refresh_token, etc.).
    encrypted_secret = Column(Text, nullable=False)
    # Free-text, plaintext label for the operator UI ("Sandbox", "Prod 2026").
    label = Column(String(120), nullable=True)

    __table_args__ = (
        UniqueConstraint("firm_id", "provider", "label", name="uq_firm_provider_label"),
    )
```

- [ ] **Step 1.3: Write the migration**

`backend/alembic/versions/20260512_add_firm_provider_credentials.py`:
```python
"""add firm_provider_credentials

Revision ID: add_firm_prov_creds
Revises: add_provider_call_log
Create Date: 2026-05-12 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "add_firm_prov_creds"
down_revision = "add_provider_call_log"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "firm_provider_credentials",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "firm_id",
            UUID(as_uuid=True),
            sa.ForeignKey("firms.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("encrypted_secret", sa.Text(), nullable=False),
        sa.Column("label", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("firm_id", "provider", "label", name="uq_firm_provider_label"),
    )
    op.create_index(
        "ix_firm_provider_credentials_firm_id",
        "firm_provider_credentials",
        ["firm_id"],
    )


def downgrade():
    op.drop_index("ix_firm_provider_credentials_firm_id", table_name="firm_provider_credentials")
    op.drop_table("firm_provider_credentials")
```

- [ ] **Step 1.4: Wire into `backend/app/main.py` model import block**

Find:
```python
from app.models import (
    ...
    provider_call_log,
) # noqa
```

Change to:
```python
from app.models import (
    ...
    provider_call_log,
    firm_provider_credential,
) # noqa
```

- [ ] **Step 1.5: Verify model + migration load**

```bash
cd backend
python -c "from app.models.firm_provider_credential import FirmProviderCredential; print('ok')"
python -c "
import importlib.util
spec = importlib.util.spec_from_file_location('m', 'alembic/versions/20260512_add_firm_provider_credentials.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print('rev:', m.revision, 'down:', m.down_revision)
"
```
Expected: `ok` and `rev: add_firm_prov_creds down: add_provider_call_log`.

- [ ] **Step 1.6: Commit**

```bash
git add backend/app/models/firm_provider_credential.py backend/app/main.py backend/alembic/versions/20260512_add_firm_provider_credentials.py
git commit -m "feat(integrations): add firm_provider_credentials table for per-firm API keys"
```

---

### Task 2: Credentials service — encrypt/decrypt helpers (TDD)

**Why:** Encryption logic must live in one place — testable, swappable when keys rotate. Provider classes call `get_credential(firm_id, provider)` and never see Fernet directly.

**Files:**
- Create: `backend/app/services/credentials.py`
- Create: `backend/tests/services/__init__.py` (empty)
- Create: `backend/tests/services/test_credentials.py`
- Inspect first: `backend/app/core/crypto.py` to reuse the existing Fernet key

- [ ] **Step 2.1: Read the existing crypto helper**

```bash
cat backend/app/core/crypto.py
```
If it exposes a `fernet` instance or `encrypt(s)` / `decrypt(s)` helpers, reuse them. If it's just a stub, the credentials service builds its own Fernet from `settings.FERNET_KEY` (or `settings.SECRET_KEY` derived) — note exactly what `crypto.py` provides in the test setup.

- [ ] **Step 2.2: Write failing test**

`backend/tests/services/test_credentials.py`:
```python
import pytest
from app.services.credentials import encrypt_secret, decrypt_secret


def test_encrypt_decrypt_round_trip():
    payload = {"api_key": "sk_live_abc123", "client_id": "ci_xyz"}
    blob = encrypt_secret(payload)
    assert blob != "sk_live_abc123"  # not plaintext
    out = decrypt_secret(blob)
    assert out == payload


def test_decrypt_rejects_tampered_blob():
    payload = {"api_key": "x"}
    blob = encrypt_secret(payload)
    with pytest.raises(Exception):
        decrypt_secret(blob[:-4] + "AAAA")  # tamper last bytes


def test_encrypt_outputs_string():
    blob = encrypt_secret({"k": "v"})
    assert isinstance(blob, str)
```

- [ ] **Step 2.3: Confirm fails**

```bash
cd backend && PYTHONPATH=. pytest tests/services/test_credentials.py -v
```
Expected: ImportError on `app.services.credentials`.

- [ ] **Step 2.4: Implement `backend/app/services/credentials.py`**

```python
"""Encrypt and decrypt JSON blobs for storage in firm_provider_credentials.

Wraps Fernet symmetric encryption. Callers pass dicts; we serialize to JSON
and Fernet-encrypt the bytes.
"""
import json

from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.firm_provider_credential import FirmProviderCredential


def _fernet() -> Fernet:
    key = getattr(settings, "FERNET_KEY", None) or settings.SECRET_KEY
    # Fernet keys must be 32 url-safe base64-encoded bytes. If the env value
    # isn't already, derive deterministically — pragmatic for a single-key setup.
    if isinstance(key, str):
        key = key.encode()
    if len(key) != 44:
        # base64.urlsafe_b64encode of 32 bytes = 44 chars. Pad/truncate from SECRET_KEY.
        import base64, hashlib
        key = base64.urlsafe_b64encode(hashlib.sha256(key).digest())
    return Fernet(key)


def encrypt_secret(payload: dict) -> str:
    return _fernet().encrypt(json.dumps(payload).encode()).decode()


def decrypt_secret(blob: str) -> dict:
    return json.loads(_fernet().decrypt(blob.encode()).decode())


async def get_credential(
    db: AsyncSession,
    firm_id,
    provider: str,
    label: str | None = None,
) -> dict | None:
    stmt = select(FirmProviderCredential).where(
        FirmProviderCredential.firm_id == firm_id,
        FirmProviderCredential.provider == provider,
    )
    if label is not None:
        stmt = stmt.where(FirmProviderCredential.label == label)
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        return None
    return decrypt_secret(row.encrypted_secret)
```

> Adjust `_fernet()` if `app/core/crypto.py` already defines something idiomatic — prefer reusing it. The shape above is a fallback for when there's nothing there.

- [ ] **Step 2.5: Pass**

```bash
PYTHONPATH=. pytest tests/services/test_credentials.py -v
```
Expected: 3 PASSED.

- [ ] **Step 2.6: Commit**

```bash
git add backend/app/services/credentials.py backend/tests/services
git commit -m "feat(integrations): credentials encrypt/decrypt service for firm_provider_credentials"
```

---

### Task 3: `GSPProvider` ABC + DTOs (TDD)

**Why:** The contract every concrete GSP must satisfy. Defining it as Pydantic-typed methods means concrete vendors can't silently drift, and mock + tests share the same shape.

**Files:**
- Create: `backend/app/integrations/gsp/__init__.py` (empty)
- Create: `backend/app/integrations/gsp/base.py`
- Create: `backend/tests/integrations/test_gsp_base.py`

- [ ] **Step 3.1: Write failing test**

`backend/tests/integrations/test_gsp_base.py`:
```python
import pytest
from datetime import date

from app.integrations.gsp.base import (
    GSPProvider,
    GstinReturn,
    GstinNotice,
    GstinLedgerEntry,
)
from app.integrations.base import ProviderConfig


def test_gst_return_dto_validates():
    r = GstinReturn(
        gstin="29ABCDE1234F2Z5",
        return_type="GSTR-3B",
        period="2026-01",
        status="filed",
        filed_at=date(2026, 2, 18),
        arn="AA290126123456X",
    )
    assert r.gstin == "29ABCDE1234F2Z5"


def test_gst_return_dto_rejects_invalid_gstin():
    with pytest.raises(Exception):
        GstinReturn(
            gstin="bad",
            return_type="GSTR-3B",
            period="2026-01",
            status="filed",
        )


def test_gsp_provider_requires_concrete_methods():
    """Subclasses must implement the four core methods."""
    class Incomplete(GSPProvider):
        name = "gsp.incomplete"
        async def _ping(self) -> bool: return True
        # missing fetch_returns, fetch_notices, fetch_ledger, fetch_gstr_2a_2b

    with pytest.raises(TypeError):
        Incomplete(ProviderConfig(api_key="x"))
```

- [ ] **Step 3.2: Confirm fails**

```bash
PYTHONPATH=. pytest tests/integrations/test_gsp_base.py -v
```

- [ ] **Step 3.3: Implement `base.py`**

```python
"""GSP (GST Suvidha Provider) abstraction.

Every concrete GSP (Masters India, IRIS, ClearTax, etc.) subclasses GSPProvider
and implements the four read methods below. Writes (filing returns, etc.) are
out of scope until v1.1 — we read-only consume during Phase 1.
"""
from __future__ import annotations

import re
from abc import abstractmethod
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.integrations.base import Provider

# --- DTOs ------------------------------------------------------------------

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$")


class _GstinModel(BaseModel):
    gstin: str

    @field_validator("gstin")
    @classmethod
    def _valid_gstin(cls, v: str) -> str:
        if not GSTIN_REGEX.match(v):
            raise ValueError(f"invalid GSTIN: {v}")
        return v


class GstinReturn(_GstinModel):
    return_type: Literal["GSTR-1", "GSTR-3B", "GSTR-9", "CMP-08"]
    period: str = Field(description="YYYY-MM for monthly, YYYY-Qn for quarterly")
    status: Literal["filed", "pending", "overdue"]
    filed_at: date | None = None
    arn: str | None = None
    due_date: date | None = None


class GstinNotice(_GstinModel):
    source_ref: str = Field(description="GSP-provided stable notice ID")
    notice_type: str
    issued_at: date
    due_date: date | None = None
    subject: str
    amount_paise: int | None = None
    pdf_url: str | None = None


class GstinLedgerEntry(_GstinModel):
    period: str
    head: Literal["IGST", "CGST", "SGST", "CESS"]
    debit_paise: int = 0
    credit_paise: int = 0
    balance_paise: int = 0


class GstinReco2A2B(_GstinModel):
    period: str
    inward_supplies: list[dict]  # raw rows; reconciliation logic lives in services
    source: Literal["2A", "2B"]


# --- Provider --------------------------------------------------------------


class GSPProvider(Provider):
    """Read-only GST data provider (returns, notices, ledger, 2A/2B)."""

    @abstractmethod
    async def fetch_returns(self, gstin: str, *, since_period: str | None = None) -> list[GstinReturn]: ...

    @abstractmethod
    async def fetch_notices(self, gstin: str, *, since: date | None = None) -> list[GstinNotice]: ...

    @abstractmethod
    async def fetch_ledger(self, gstin: str, *, period: str) -> list[GstinLedgerEntry]: ...

    @abstractmethod
    async def fetch_gstr_2a_2b(self, gstin: str, *, period: str, source: Literal["2A", "2B"]) -> GstinReco2A2B: ...
```

- [ ] **Step 3.4: Pass**

```bash
PYTHONPATH=. pytest tests/integrations/test_gsp_base.py -v
```
Expected: 3 PASSED.

- [ ] **Step 3.5: Commit**

```bash
git add backend/app/integrations/gsp backend/tests/integrations/test_gsp_base.py
git commit -m "feat(integrations): GSPProvider ABC with typed DTOs (returns, notices, ledger, 2A/2B)"
```

---

### Task 4: `MockGspProvider` (TDD)

**Why:** Sync workers, compliance upsert logic, and the sync UI all need *something* that behaves like a GSP for tests + dev. Mock returns fixture data that's realistic enough to drive integration tests.

**Files:**
- Create: `backend/app/integrations/gsp/mock.py`
- Create: `backend/tests/integrations/test_gsp_mock.py`

- [ ] **Step 4.1: Write failing test**

```python
import pytest
from datetime import date
from app.integrations.base import ProviderConfig
from app.integrations.gsp.mock import MockGspProvider
from app.integrations.gsp.base import GstinReturn, GstinNotice


@pytest.fixture
def provider():
    return MockGspProvider(ProviderConfig(api_key="ignored"))


@pytest.mark.asyncio
async def test_returns_emit_realistic_returns(provider):
    rows = await provider.fetch_returns("29ABCDE1234F2Z5")
    assert len(rows) > 0
    assert all(isinstance(r, GstinReturn) for r in rows)
    assert any(r.return_type == "GSTR-3B" for r in rows)


@pytest.mark.asyncio
async def test_notices_emit_realistic_notices(provider):
    rows = await provider.fetch_notices("29ABCDE1234F2Z5")
    assert len(rows) > 0
    assert all(isinstance(r, GstinNotice) for r in rows)
    # source_ref must be stable across calls (used for dedup)
    rows2 = await provider.fetch_notices("29ABCDE1234F2Z5")
    assert {r.source_ref for r in rows} == {r.source_ref for r in rows2}


@pytest.mark.asyncio
async def test_ledger_returns_one_entry_per_head(provider):
    entries = await provider.fetch_ledger("29ABCDE1234F2Z5", period="2026-01")
    heads = {e.head for e in entries}
    assert heads == {"IGST", "CGST", "SGST", "CESS"}


@pytest.mark.asyncio
async def test_2a_returns_inward_supplies(provider):
    reco = await provider.fetch_gstr_2a_2b("29ABCDE1234F2Z5", period="2026-01", source="2A")
    assert reco.source == "2A"
    assert isinstance(reco.inward_supplies, list)
```

- [ ] **Step 4.2: Confirm fails**

```bash
PYTHONPATH=. pytest tests/integrations/test_gsp_mock.py -v
```

- [ ] **Step 4.3: Implement `mock.py`**

```python
"""Mock GSP for tests + dev. Returns deterministic fixture data per GSTIN."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Literal

from app.integrations.gsp.base import (
    GSPProvider,
    GstinLedgerEntry,
    GstinNotice,
    GstinReco2A2B,
    GstinReturn,
)


class MockGspProvider(GSPProvider):
    name = "gsp.mock"

    async def _ping(self) -> bool:
        return True

    async def fetch_returns(self, gstin: str, *, since_period: str | None = None) -> list[GstinReturn]:
        today = date.today()
        return [
            GstinReturn(
                gstin=gstin, return_type="GSTR-3B",
                period=f"{today.year}-{today.month:02d}",
                status="filed", filed_at=today - timedelta(days=5),
                arn=f"AA{gstin[:2]}{today.year}{today.month:02d}123456X",
                due_date=today.replace(day=20),
            ),
            GstinReturn(
                gstin=gstin, return_type="GSTR-1",
                period=f"{today.year}-{today.month:02d}",
                status="pending", due_date=today + timedelta(days=10),
            ),
        ]

    async def fetch_notices(self, gstin: str, *, since: date | None = None) -> list[GstinNotice]:
        today = date.today()
        return [
            GstinNotice(
                gstin=gstin,
                source_ref=f"NOTICE-{gstin}-001",
                notice_type="GSTR-3A",
                issued_at=today - timedelta(days=3),
                due_date=today + timedelta(days=14),
                subject="Notice for non-filing of returns",
                amount_paise=None,
            ),
        ]

    async def fetch_ledger(self, gstin: str, *, period: str) -> list[GstinLedgerEntry]:
        return [
            GstinLedgerEntry(
                gstin=gstin, period=period, head=h,
                debit_paise=10000, credit_paise=12000, balance_paise=2000,
            )
            for h in ("IGST", "CGST", "SGST", "CESS")
        ]

    async def fetch_gstr_2a_2b(
        self, gstin: str, *, period: str, source: Literal["2A", "2B"]
    ) -> GstinReco2A2B:
        return GstinReco2A2B(
            gstin=gstin, period=period, source=source,
            inward_supplies=[
                {
                    "supplier_gstin": "27AAAAA0000A1Z5",
                    "invoice_number": "INV-001",
                    "invoice_date": str(date.today()),
                    "taxable_value_paise": 100000,
                    "igst_paise": 18000,
                },
            ],
        )
```

- [ ] **Step 4.4: Pass**

```bash
PYTHONPATH=. pytest tests/integrations/test_gsp_mock.py -v
```
Expected: 4 PASSED.

- [ ] **Step 4.5: Commit**

```bash
git add backend/app/integrations/gsp/mock.py backend/tests/integrations/test_gsp_mock.py
git commit -m "feat(integrations): MockGspProvider with deterministic fixture data"
```

---

### Task 5: `MCAProvider` ABC + Mock (TDD)

**Why:** Same shape as GSP — abstraction first, mock for tests, vendor pick later.

**Files:**
- Create: `backend/app/integrations/mca/__init__.py`
- Create: `backend/app/integrations/mca/base.py`
- Create: `backend/app/integrations/mca/mock.py`
- Create: `backend/tests/integrations/test_mca_base.py`
- Create: `backend/tests/integrations/test_mca_mock.py`

- [ ] **Step 5.1: Write failing tests**

`backend/tests/integrations/test_mca_base.py`:
```python
import pytest
from app.integrations.mca.base import (
    MCAProvider,
    CompanyStatus,
    Director,
    FormFiling,
)


def test_company_status_validates():
    s = CompanyStatus(
        cin="U72200KA2020PTC123456",
        name="Acme Tech Pvt Ltd",
        status="active",
        date_of_incorporation="2020-04-15",
    )
    assert s.cin == "U72200KA2020PTC123456"


def test_company_status_rejects_invalid_cin():
    with pytest.raises(Exception):
        CompanyStatus(cin="bad", name="x", status="active", date_of_incorporation="2020-01-01")


def test_director_dto():
    d = Director(din="00012345", name="A B Sharma", role="Director", appointed_on="2020-04-15")
    assert d.din == "00012345"
```

`backend/tests/integrations/test_mca_mock.py`:
```python
import pytest
from app.integrations.base import ProviderConfig
from app.integrations.mca.mock import MockMcaProvider


@pytest.mark.asyncio
async def test_status_returns_company():
    p = MockMcaProvider(ProviderConfig(api_key="x"))
    s = await p.fetch_status("U72200KA2020PTC123456")
    assert s.name


@pytest.mark.asyncio
async def test_directors_returns_list():
    p = MockMcaProvider(ProviderConfig(api_key="x"))
    ds = await p.fetch_directors("U72200KA2020PTC123456")
    assert len(ds) >= 1


@pytest.mark.asyncio
async def test_forms_returns_history():
    p = MockMcaProvider(ProviderConfig(api_key="x"))
    forms = await p.fetch_forms("U72200KA2020PTC123456")
    assert isinstance(forms, list)
```

- [ ] **Step 5.2: Confirm fails**

- [ ] **Step 5.3: Implement `mca/base.py`**

```python
"""MCA (Ministry of Corporate Affairs) abstraction. Read-only.

Concrete vendors (Probe42, Tofler, KarmaV3) provide live data; Mock for tests.
"""
from __future__ import annotations

import re
from abc import abstractmethod
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.integrations.base import Provider

CIN_REGEX = re.compile(r"^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$")


class _CinModel(BaseModel):
    cin: str

    @field_validator("cin")
    @classmethod
    def _valid_cin(cls, v: str) -> str:
        if not CIN_REGEX.match(v):
            raise ValueError(f"invalid CIN: {v}")
        return v


class CompanyStatus(_CinModel):
    name: str
    status: Literal["active", "strike-off", "amalgamated", "dissolved", "under-process", "unknown"]
    date_of_incorporation: date
    paid_up_capital_paise: int | None = None
    registered_address: str | None = None


class Director(BaseModel):
    din: str
    name: str
    role: str
    appointed_on: date
    ceased_on: date | None = None


class FormFiling(BaseModel):
    form_name: str
    filed_on: date
    fy: str
    sc: str | None = Field(None, description="Service Request Number")


class MCAProvider(Provider):
    @abstractmethod
    async def fetch_status(self, cin: str) -> CompanyStatus: ...

    @abstractmethod
    async def fetch_directors(self, cin: str) -> list[Director]: ...

    @abstractmethod
    async def fetch_forms(self, cin: str) -> list[FormFiling]: ...
```

- [ ] **Step 5.4: Implement `mca/mock.py`**

```python
"""Mock MCA for tests + dev."""
from __future__ import annotations

from datetime import date

from app.integrations.mca.base import CompanyStatus, Director, FormFiling, MCAProvider


class MockMcaProvider(MCAProvider):
    name = "mca.mock"

    async def _ping(self) -> bool:
        return True

    async def fetch_status(self, cin: str) -> CompanyStatus:
        return CompanyStatus(
            cin=cin,
            name="Acme Tech Pvt Ltd",
            status="active",
            date_of_incorporation=date(2020, 4, 15),
            paid_up_capital_paise=10000000,
            registered_address="Bangalore, Karnataka",
        )

    async def fetch_directors(self, cin: str) -> list[Director]:
        return [
            Director(din="00012345", name="A B Sharma", role="Director",
                     appointed_on=date(2020, 4, 15)),
            Director(din="00067890", name="C D Verma", role="Whole-Time Director",
                     appointed_on=date(2021, 6, 1)),
        ]

    async def fetch_forms(self, cin: str) -> list[FormFiling]:
        return [
            FormFiling(form_name="AOC-4", filed_on=date(2025, 10, 28), fy="2024-25"),
            FormFiling(form_name="MGT-7", filed_on=date(2025, 11, 15), fy="2024-25"),
        ]
```

- [ ] **Step 5.5: Pass**

```bash
PYTHONPATH=. pytest tests/integrations/test_mca_base.py tests/integrations/test_mca_mock.py -v
```
Expected: 6 PASSED.

- [ ] **Step 5.6: Commit**

```bash
git add backend/app/integrations/mca backend/tests/integrations/test_mca_base.py backend/tests/integrations/test_mca_mock.py
git commit -m "feat(integrations): MCAProvider ABC + MockMcaProvider"
```

---

### Task 6: Compliance + Notice upsert service (TDD)

**Why:** This is the heart of the sync flow — turn provider DTOs into rows in our `compliance` and `notice` tables, idempotently. Idempotency is non-negotiable: re-running sync must not duplicate.

**Files:**
- Create: `backend/app/services/sync/__init__.py`
- Create: `backend/app/services/sync/upsert.py`
- Create: `backend/tests/services/test_sync_upsert.py`

> **Test infra note:** This task is the first that genuinely needs a `db_session` fixture. If `backend/tests/conftest.py` doesn't have one, build it here (testcontainers or sqlite + the test DB URL from CI) and reuse from now on. Do not skip the DB tests — idempotency without a real DB test is a lie.

- [ ] **Step 6.1: Add `db_session` fixture to `backend/tests/conftest.py`**

If a fixture already exists, skip to 6.2. Otherwise add:

```python
import asyncio
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine):
    async_sm = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
    async with async_sm() as s:
        yield s
        await s.rollback()
```

> Add `aiosqlite` to `backend/requirements.txt` if missing, and `pytest-asyncio` (already there).
> If schema differences between Postgres and sqlite bite (e.g. `JSONB`, `UUID`), add `requirements.txt` doesn't help — switch the test fixture to `testcontainers-python` with a Postgres container. Acceptable to make that switch as part of this task if sqlite chokes on first run.

- [ ] **Step 6.2: Write failing test**

`backend/tests/services/test_sync_upsert.py`:
```python
import pytest
from datetime import date
from uuid import uuid4

from app.integrations.gsp.base import GstinReturn, GstinNotice
from app.services.sync.upsert import upsert_returns, upsert_notices
from app.models.compliance import Compliance, ComplianceType, ComplianceStatus
from app.models.notice import Notice  # adjust if class name differs
from sqlalchemy import select


@pytest.mark.asyncio
async def test_upsert_returns_creates_then_updates(db_session):
    firm_id = uuid4()
    client_id = uuid4()
    gstin = "29ABCDE1234F2Z5"

    rows = [GstinReturn(
        gstin=gstin, return_type="GSTR-3B", period="2026-01",
        status="pending", due_date=date(2026, 2, 20),
    )]

    await upsert_returns(db_session, firm_id=firm_id, client_id=client_id, returns=rows)
    await db_session.commit()

    res = (await db_session.execute(select(Compliance).where(Compliance.firm_id == firm_id))).scalars().all()
    assert len(res) == 1
    assert res[0].status == ComplianceStatus.pending

    # Run again with status=filed; should UPDATE not INSERT
    rows[0] = rows[0].model_copy(update={"status": "filed", "filed_at": date(2026, 2, 18),
                                          "arn": "AA290126123456X"})
    await upsert_returns(db_session, firm_id=firm_id, client_id=client_id, returns=rows)
    await db_session.commit()

    res = (await db_session.execute(select(Compliance).where(Compliance.firm_id == firm_id))).scalars().all()
    assert len(res) == 1  # still one row
    assert res[0].status == ComplianceStatus.filed
    assert res[0].filing_reference == "AA290126123456X"


@pytest.mark.asyncio
async def test_upsert_notices_dedups_by_source_ref(db_session):
    firm_id = uuid4()
    client_id = uuid4()
    notices = [GstinNotice(
        gstin="29ABCDE1234F2Z5", source_ref="N-001", notice_type="GSTR-3A",
        issued_at=date(2026, 5, 1), subject="non-filing",
    )]
    await upsert_notices(db_session, firm_id=firm_id, client_id=client_id, notices=notices)
    await upsert_notices(db_session, firm_id=firm_id, client_id=client_id, notices=notices)
    await db_session.commit()

    res = (await db_session.execute(select(Notice).where(Notice.firm_id == firm_id))).scalars().all()
    assert len(res) == 1
```

> If your `Notice` model lives in a different module or has a different class name, adjust the import. Inspect `backend/app/models/notice.py` first.

- [ ] **Step 6.3: Confirm fails (ImportError)**

- [ ] **Step 6.4: Implement `upsert.py`**

```python
"""Idempotent upsert of GSP/MCA sync results into compliance + notice tables.

Natural keys:
- compliance: (firm_id, client_id, type, period)
- notice: (firm_id, client_id, source_ref)
"""
from __future__ import annotations

from typing import Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.gsp.base import GstinNotice, GstinReturn
from app.models.compliance import Compliance, ComplianceStatus, ComplianceType
from app.models.notice import Notice


_RETURN_TYPE_MAP = {
    "GSTR-1": ComplianceType.GST,
    "GSTR-3B": ComplianceType.GST,
    "GSTR-9": ComplianceType.GST,
    "CMP-08": ComplianceType.GST,
}


async def upsert_returns(
    db: AsyncSession,
    *,
    firm_id: UUID,
    client_id: UUID,
    returns: Iterable[GstinReturn],
) -> None:
    for r in returns:
        period_label = f"{r.return_type} {r.period}"
        existing = (await db.execute(
            select(Compliance).where(
                Compliance.firm_id == firm_id,
                Compliance.client_id == client_id,
                Compliance.type == _RETURN_TYPE_MAP[r.return_type],
                Compliance.period == period_label,
            )
        )).scalar_one_or_none()

        status = ComplianceStatus(r.status) if r.status in {s.value for s in ComplianceStatus} else ComplianceStatus.pending

        if existing is None:
            db.add(Compliance(
                firm_id=firm_id,
                client_id=client_id,
                type=_RETURN_TYPE_MAP[r.return_type],
                period=period_label,
                due_date=r.due_date,
                status=status,
                filing_reference=r.arn,
            ))
        else:
            existing.status = status
            existing.due_date = r.due_date or existing.due_date
            if r.arn:
                existing.filing_reference = r.arn


async def upsert_notices(
    db: AsyncSession,
    *,
    firm_id: UUID,
    client_id: UUID,
    notices: Iterable[GstinNotice],
) -> None:
    for n in notices:
        existing = (await db.execute(
            select(Notice).where(
                Notice.firm_id == firm_id,
                Notice.client_id == client_id,
                Notice.source_ref == n.source_ref,
            )
        )).scalar_one_or_none()

        if existing is None:
            db.add(Notice(
                firm_id=firm_id,
                client_id=client_id,
                source_ref=n.source_ref,
                notice_type=n.notice_type,
                issued_at=n.issued_at,
                due_date=n.due_date,
                subject=n.subject,
                amount_paise=n.amount_paise,
                pdf_url=n.pdf_url,
            ))
        else:
            # Notices generally don't change after issue; only refresh due_date / amount.
            existing.due_date = n.due_date or existing.due_date
            existing.amount_paise = n.amount_paise or existing.amount_paise
```

> If `Notice` model lacks `source_ref` field, **add it** in this task as a separate Alembic migration before the tests pass. Inspect the existing model first; if `source_ref` doesn't exist, the migration is:
> ```python
> op.add_column("notices", sa.Column("source_ref", sa.String(128), nullable=True))
> op.create_index("ix_notices_firm_source_ref", "notices", ["firm_id", "source_ref"], unique=False)
> ```
> and update the model.

- [ ] **Step 6.5: Pass**

```bash
PYTHONPATH=. pytest tests/services/test_sync_upsert.py -v
```
Expected: 2 PASSED.

- [ ] **Step 6.6: Commit**

```bash
git add backend/app/services/sync backend/tests/services/test_sync_upsert.py backend/tests/conftest.py
# Plus any model/migration changes from the source_ref note above.
git commit -m "feat(sync): idempotent upsert of GSP returns + notices into compliance/notice"
```

---

### Task 7: GSP sync orchestrator (TDD with mock provider)

**Files:**
- Create: `backend/app/services/sync/gst.py`
- Create: `backend/tests/services/test_sync_gst.py`

- [ ] **Step 7.1: Write failing test**

```python
import pytest
from uuid import uuid4
from app.integrations.base import ProviderConfig
from app.integrations.gsp.mock import MockGspProvider
from app.services.sync.gst import sync_gst_for_firm
from app.models.client import Client


@pytest.mark.asyncio
async def test_sync_gst_iterates_clients_with_gstin(db_session):
    firm_id = uuid4()
    # Seed two clients, one with GSTIN, one without
    c1 = Client(id=uuid4(), firm_id=firm_id, name="Client A", gstin="29ABCDE1234F2Z5")
    c2 = Client(id=uuid4(), firm_id=firm_id, name="Client B", gstin=None)
    db_session.add_all([c1, c2])
    await db_session.commit()

    provider = MockGspProvider(ProviderConfig(api_key="x"))
    summary = await sync_gst_for_firm(db_session, firm_id=firm_id, provider=provider)
    await db_session.commit()

    assert summary["clients_synced"] == 1
    assert summary["returns_upserted"] >= 2  # Mock yields 2 returns per gstin
    assert summary["notices_upserted"] >= 1
```

> Adjust client field name if the existing `Client` model uses `gstin_number` or similar. Read `backend/app/models/client.py` first.

- [ ] **Step 7.2: Confirm fails**

- [ ] **Step 7.3: Implement `gst.py`**

```python
"""Run a full GSP sync for one firm: iterate clients with GSTINs, fetch all
return statuses + notices via the provider, idempotently upsert into compliance + notice.
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.gsp.base import GSPProvider
from app.models.client import Client
from app.services.sync.upsert import upsert_notices, upsert_returns


async def sync_gst_for_firm(
    db: AsyncSession,
    *,
    firm_id: UUID,
    provider: GSPProvider,
) -> dict:
    rows = (await db.execute(
        select(Client).where(
            Client.firm_id == firm_id,
            Client.gstin.is_not(None),
        )
    )).scalars().all()

    clients_synced = 0
    returns_upserted = 0
    notices_upserted = 0

    for client in rows:
        gstin = client.gstin
        try:
            returns = await provider.fetch_returns(gstin, _firm_id=str(firm_id))
            await upsert_returns(db, firm_id=firm_id, client_id=client.id, returns=returns)
            returns_upserted += len(returns)

            notices = await provider.fetch_notices(gstin, _firm_id=str(firm_id))
            await upsert_notices(db, firm_id=firm_id, client_id=client.id, notices=notices)
            notices_upserted += len(notices)

            clients_synced += 1
        except Exception:
            # One bad GSTIN must not poison the whole firm sync.
            # Provider's @metered decorator already logged the failure.
            continue

    return {
        "clients_synced": clients_synced,
        "returns_upserted": returns_upserted,
        "notices_upserted": notices_upserted,
    }
```

> Note: `_firm_id=str(firm_id)` is passed through so the `@metered` decorator from Phase 0 records the firm against each call. Concrete vendor implementations (Phase 1B) will need `@metered`/`@retry_reads`/`@breaker` decorators applied to their methods.

- [ ] **Step 7.4: Pass**

```bash
PYTHONPATH=. pytest tests/services/test_sync_gst.py -v
```

- [ ] **Step 7.5: Commit**

```bash
git add backend/app/services/sync/gst.py backend/tests/services/test_sync_gst.py
git commit -m "feat(sync): sync_gst_for_firm orchestrator with per-client error isolation"
```

---

### Task 8: MCA sync orchestrator (TDD)

**Files:**
- Create: `backend/app/services/sync/mca.py`
- Create: `backend/tests/services/test_sync_mca.py`

> Mirror Task 7 with MCA. Sync iterates clients that have a `cin` field (add to client model if missing — separate migration). Upserts go to a `client_mca_snapshot` table OR enrich `Client` model — pick during execution based on which is less invasive. Recommend a snapshot table to avoid mutating the Client model on every sync.

- [ ] **Step 8.1: Inspect `app/models/client.py` for `cin` field, decide snapshot vs in-place**

If no `cin`, add as a migration. The snapshot vs in-place decision: snapshot adds a `client_mca_snapshot` table (firm_id, client_id, status, paid_up_capital_paise, last_synced_at, snapshot_jsonb). In-place updates Client columns.

Recommend: snapshot. Keeps Client lean, gives history if needed later.

- [ ] **Step 8.2-7: Mirror Task 7 structure** — write failing test against `MockMcaProvider`, implement `sync_mca_for_firm`, idempotent upsert, commit.

The shape:
```python
async def sync_mca_for_firm(db, *, firm_id, provider: MCAProvider) -> dict:
    # 1. Query clients with CIN
    # 2. For each: fetch_status, fetch_directors, fetch_forms
    # 3. Upsert into client_mca_snapshot (delete-then-insert per client is acceptable here)
    # 4. Return {clients_synced, snapshots_written}
```

- [ ] **Step 8.8: Commit**

```bash
git commit -m "feat(sync): sync_mca_for_firm orchestrator with snapshot upsert"
```

---

### Task 9: Celery tasks + beat schedule

**Files:**
- Modify: `backend/app/workers/tasks.py`
- Modify: `backend/app/core/celery_app.py`

- [ ] **Step 9.1: Add Celery tasks**

In `backend/app/workers/tasks.py`, append:

```python
from celery import shared_task
from app.core.celery_app import celery_app
from app.db.database import AsyncSessionLocal
from app.integrations.base import ProviderConfig
from app.integrations.gsp.mock import MockGspProvider
from app.integrations.mca.mock import MockMcaProvider
from app.services.credentials import get_credential
from app.services.sync.gst import sync_gst_for_firm
from app.services.sync.mca import sync_mca_for_firm
import asyncio


def _run(coro):
    """Run an async function from a sync Celery task body."""
    return asyncio.run(coro)


@celery_app.task(name="app.workers.tasks.nightly_gst_sync")
def nightly_gst_sync():
    """Beat-scheduled — iterates all firms, runs GST sync for each.

    Until concrete vendor classes land (Phase 1B), uses MockGspProvider.
    Switch the provider construction below once a real vendor is configured.
    """
    async def _go():
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            from app.models.firm import Firm
            firms = (await db.execute(select(Firm))).scalars().all()
            results = []
            for firm in firms:
                creds = await get_credential(db, firm.id, "gsp.mock") or {"api_key": "mock"}
                provider = MockGspProvider(ProviderConfig(api_key=creds["api_key"]))
                summary = await sync_gst_for_firm(db, firm_id=firm.id, provider=provider)
                await db.commit()
                results.append({"firm_id": str(firm.id), **summary})
            return results
    return _run(_go())


@celery_app.task(name="app.workers.tasks.nightly_mca_sync")
def nightly_mca_sync():
    async def _go():
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            from app.models.firm import Firm
            firms = (await db.execute(select(Firm))).scalars().all()
            for firm in firms:
                creds = await get_credential(db, firm.id, "mca.mock") or {"api_key": "mock"}
                provider = MockMcaProvider(ProviderConfig(api_key=creds["api_key"]))
                await sync_mca_for_firm(db, firm_id=firm.id, provider=provider)
                await db.commit()
    return _run(_go())
```

- [ ] **Step 9.2: Add beat schedule**

In `backend/app/core/celery_app.py`, extend `beat_schedule`:

```python
celery_app.conf.beat_schedule.update({
    "nightly-gst-sync": {
        "task": "app.workers.tasks.nightly_gst_sync",
        "schedule": crontab(hour=20, minute=30),  # 02:00 IST = 20:30 UTC
    },
    "nightly-mca-sync": {
        "task": "app.workers.tasks.nightly_mca_sync",
        "schedule": crontab(hour=21, minute=0),   # 02:30 IST
    },
})
```

- [ ] **Step 9.3: Smoke test (manual, in container terminal once deployed)**

```bash
celery -A app.core.celery_app inspect scheduled
celery -A app.core.celery_app call app.workers.tasks.nightly_gst_sync
```

- [ ] **Step 9.4: Commit**

```bash
git commit -m "feat(workers): nightly GSP + MCA Celery tasks with beat schedule"
```

---

### Task 10: Manual sync trigger endpoint

**Files:**
- Create: `backend/app/api/sync.py`
- Modify: `backend/app/main.py` (register router)
- Modify: `backend/app/api/portal_sync.py` (point legacy route to new sync)

- [ ] **Step 10.1: Implement endpoint**

```python
"""POST /api/sync/gst and /api/sync/mca — manual sync triggers per firm.

Returns the sync summary inline (returns_upserted, notices_upserted, etc.).
Until vendor classes land in Phase 1B, this uses Mock providers — flip the
provider construction here when ready.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin
from app.db.database import get_db
from app.integrations.base import ProviderConfig
from app.integrations.gsp.mock import MockGspProvider
from app.integrations.mca.mock import MockMcaProvider
from app.models.user import User
from app.services.credentials import get_credential
from app.services.sync.gst import sync_gst_for_firm
from app.services.sync.mca import sync_mca_for_firm

router = APIRouter()


@router.post("/gst")
async def trigger_gst_sync(
    user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    creds = await get_credential(db, user.firm_id, "gsp.mock") or {"api_key": "mock"}
    provider = MockGspProvider(ProviderConfig(api_key=creds["api_key"]))
    summary = await sync_gst_for_firm(db, firm_id=user.firm_id, provider=provider)
    await db.commit()
    return {"status": "ok", **summary}


@router.post("/mca")
async def trigger_mca_sync(
    user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    creds = await get_credential(db, user.firm_id, "mca.mock") or {"api_key": "mock"}
    provider = MockMcaProvider(ProviderConfig(api_key=creds["api_key"]))
    await sync_mca_for_firm(db, firm_id=user.firm_id, provider=provider)
    await db.commit()
    return {"status": "ok"}
```

- [ ] **Step 10.2: Register in `main.py`** — add `sync` to API imports and `app.include_router(sync.router, prefix="/api/sync", tags=["Sync"])`.

- [ ] **Step 10.3: Update `portal_sync.py` to redirect (legacy URL kindness)**

```python
"""Deprecated. Use /api/sync/gst instead."""
from fastapi import APIRouter
from fastapi.responses import RedirectResponse, JSONResponse

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gone(path: str):
    return JSONResponse(
        status_code=410,
        content={
            "detail": "portal_sync is deprecated; use POST /api/sync/gst or POST /api/sync/mca.",
        },
    )
```

- [ ] **Step 10.4: Commit**

```bash
git commit -m "feat(api): manual sync trigger endpoints (POST /api/sync/gst, /mca)"
```

---

### Task 11: Tally Prime XML voucher service (TDD)

**Files:**
- Create: `backend/app/services/tally_export/__init__.py`
- Create: `backend/app/services/tally_export/voucher.py`
- Create: `backend/tests/services/test_tally_voucher.py`

- [ ] **Step 11.1: Inspect existing Invoice model** — `backend/app/models/invoice.py`. Note line item structure, GST fields, party (client) link. Tally voucher needs: voucher type, date, party ledger name, item rows (name, qty, rate, amount), tax ledgers (CGST/SGST/IGST), narration.

- [ ] **Step 11.2: Failing test**

```python
import pytest
from datetime import date
from app.services.tally_export.voucher import invoice_to_tally_xml


def test_invoice_to_xml_includes_required_elements():
    invoice = _fake_invoice(
        number="INV-001", invoice_date=date(2026, 5, 1),
        party_name="Acme Ltd", party_gstin="29ACME1234F2Z5",
        items=[{"name": "Consultancy", "qty": 1, "rate": 5000, "amount": 5000}],
        cgst=450, sgst=450, igst=0, total=5900,
    )
    xml = invoice_to_tally_xml(invoice)
    assert "<TALLYMESSAGE" in xml
    assert "<VOUCHER" in xml
    assert "INV-001" in xml
    assert "Acme Ltd" in xml
    assert "Consultancy" in xml
```

- [ ] **Step 11.3: Implement** — use Python's `xml.etree.ElementTree` to build the structure. Follow Tally Prime's `<ENVELOPE>/<HEADER>/<BODY>/<IMPORTDATA>` import format. Reference: Tally Developer's Reference Manual (free PDF; you'll match `Voucher` element shape).

- [ ] **Step 11.4: Pass; commit**

---

### Task 12: Tally bulk export endpoint (TDD)

**Files:**
- Create: `backend/app/services/tally_export/bundle.py`
- Create: `backend/app/api/tally.py`
- Modify: `backend/app/main.py`

- [ ] **Step 12.1: Service** — `bundle_invoices_to_tally_zip(db, firm_id, from_date, to_date) -> bytes` returns a zip with `vouchers.xml` (single envelope containing all vouchers) + a `summary.csv`.

- [ ] **Step 12.2: Endpoint** — `GET /api/tally/export?from=2026-04-01&to=2026-04-30` returns `application/zip`. Gated to `firm_admin`.

- [ ] **Step 12.3: Test** — full integration: seed 3 invoices, hit endpoint, parse the returned zip, verify XML wellformed and contains all 3.

---

### Task 13: Compliance sync UX (frontend)

**Files:**
- Create: `frontend/app/(dashboard)/compliance/_components/SyncBanner.tsx`
- Create: `frontend/app/(dashboard)/compliance/_components/SyncTrigger.tsx`
- Modify: `frontend/app/(dashboard)/compliance/page.tsx`
- Modify: `frontend/lib/api.ts` (add `triggerGspSync`, `triggerMcaSync`)

- [ ] **Step 13.1: API helpers**

In `frontend/lib/api.ts`:
```ts
export const triggerGspSync = () => api.post<{returns_upserted: number; notices_upserted: number; clients_synced: number}>("/api/sync/gst");
export const triggerMcaSync = () => api.post<{}>("/api/sync/mca");
```

- [ ] **Step 13.2: SyncBanner.tsx** — passive component showing "Last synced: 2 hours ago" + a small "Sync now" button. Hits `triggerGspSync`, shows result toast.

- [ ] **Step 13.3: SyncTrigger.tsx** — modal that runs both GSP + MCA syncs sequentially, shows per-step progress and final summary. Used from a dashboard "Sync everything" button.

- [ ] **Step 13.4: Wire into compliance page** — render `<SyncBanner>` at top.

- [ ] **Step 13.5: Manual smoke** — run frontend dev server, click sync, confirm rows update in compliance table.

- [ ] **Step 13.6: Commit**

---

### Task 14: Tally export UI (frontend)

**Files:**
- Create: `frontend/app/(dashboard)/billing/_components/TallyExportButton.tsx`
- Modify: `frontend/app/(dashboard)/billing/page.tsx`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 14.1: API helper** — `getTallyExport(from: string, to: string)` triggers a browser download.

- [ ] **Step 14.2: TallyExportButton** — date-range picker, "Download Tally XML" button.

- [ ] **Step 14.3: Wire onto billing page next to existing actions.**

- [ ] **Step 14.4: Manual smoke** — pick a range with 1+ invoices, download, open the XML in a text editor and confirm wellformed.

- [ ] **Step 14.5: Commit**

---

### Task 15: Vendor sandbox spike harness

**Why:** When you start evaluating real vendors (Masters India, IRIS, etc.), you need to exercise their sandbox APIs against the contract. This script wraps that — drop in any `GSPProvider` impl, get a pass/fail report.

**Files:**
- Create: `backend/scripts/vendor_spike.py`

- [ ] **Step 15.1: Implement**

```python
"""Run a sandbox spike against a concrete GSPProvider implementation.

Usage:
    python -m scripts.vendor_spike gsp masters_india <gstin> --api-key=...

Reports per-method: success | timeout | error, with sample row counts. Use this
during the Phase 1B vendor evaluation; do NOT use in production traffic.
"""
import argparse
import asyncio
import importlib
from datetime import date

from app.integrations.base import ProviderConfig


async def _run_gsp(provider, gstin: str):
    print(f"=== Spike: {provider.name} against {gstin} ===")
    for method in ("fetch_returns", "fetch_notices", "fetch_ledger", "fetch_gstr_2a_2b"):
        try:
            kwargs = {}
            if method == "fetch_ledger":
                kwargs = {"period": "2026-01"}
            elif method == "fetch_gstr_2a_2b":
                kwargs = {"period": "2026-01", "source": "2A"}
            result = await getattr(provider, method)(gstin, **kwargs)
            n = len(result) if isinstance(result, list) else 1
            print(f"  {method}: ok ({n} item{'s' if n != 1 else ''})")
        except Exception as e:
            print(f"  {method}: {type(e).__name__}: {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["gsp", "mca"])
    ap.add_argument("vendor", help="module name under app.integrations.{gsp,mca}")
    ap.add_argument("identifier", help="GSTIN or CIN")
    ap.add_argument("--api-key", required=True)
    args = ap.parse_args()

    pkg = "app.integrations.gsp" if args.kind == "gsp" else "app.integrations.mca"
    mod = importlib.import_module(f"{pkg}.{args.vendor}")
    cls_name = next(n for n in dir(mod) if n.endswith("Provider") and "Mock" not in n)
    cls = getattr(mod, cls_name)
    provider = cls(ProviderConfig(api_key=args.api_key))

    if args.kind == "gsp":
        asyncio.run(_run_gsp(provider, args.identifier))
    else:
        # similar for MCA
        pass


if __name__ == "__main__":
    main()
```

- [ ] **Step 15.2: Smoke against MockGspProvider**

```bash
cd backend && python -m scripts.vendor_spike gsp mock 29ABCDE1234F2Z5 --api-key=anything
```
Expected: 4 lines all "ok".

- [ ] **Step 15.3: Commit**

---

### Task 16: Phase 1 Foundations milestone verification

- [ ] **Step 16.1: Tests green**

```bash
cd backend && PYTHONPATH=. pytest tests -v
```
Expected: all green; `tests/integrations` and `tests/services` exercised.

- [ ] **Step 16.2: Lint + types green**

```bash
ruff check app/integrations app/core/logging.py app/core/sentry.py app/services
ruff format --check app/integrations app/core/logging.py app/core/sentry.py app/services
mypy
```

> If `app/services` ruff check finds existing-code lint, scope-tighten before committing rather than drifting into mass cleanup. Add `app/services/sync` and `app/services/tally_export` to the ruff/mypy scope; leave older services alone.

- [ ] **Step 16.3: Migrations apply**

In a Dokploy backend container terminal:
```bash
alembic upgrade head
```

- [ ] **Step 16.4: Manual end-to-end smoke**

1. Open the frontend, log in as admin.
2. Click "Sync now" in the Compliance page.
3. Confirm summary toast: "X clients synced, Y returns upserted, Z notices upserted".
4. Confirm Compliance table shows new pending GSTR-1 rows with the right due dates.
5. Confirm Notices page shows the seeded notice.
6. Open Billing → Tally Export, pick April–April, download. Open the XML, confirm wellformed and at least one `<VOUCHER>` element.

- [ ] **Step 16.5: Tag**

```bash
git tag -a phase-1-foundations -m "Phase 1 Foundations complete: GSP + MCA ABCs + Mocks + sync workers + Tally export. Concrete vendor classes land in Phase 1B."
git push --tags
```

- [ ] **Step 16.6: Open issue / note for Phase 1B**

In your tracker: "Phase 1B — vendor evaluation. Sandbox spike Masters India + IRIS + Probe42 + KarmaV3 against §7 checklist. Target: pick GSP and MCA vendor within 2 weeks, sign sandbox agreements only."

---

## Self-review

**Spec coverage** (against §6 Phase 1):
- ✅ GSP provider impl + sync worker for returns / notices / ledger / 2A/2B → Tasks 3, 4, 7
- ✅ MCA provider impl + sync worker → Tasks 5, 8
- ✅ Vault extension for per-firm credentials → Tasks 1, 2
- ✅ Replace `portal_sync.py` with new sync UX → Tasks 10, 13
- ✅ Tally export started → Tasks 11, 12, 14
- ⚠️ "Evaluate 2 GSPs" — covered by sandbox spike harness (Task 15) and Phase 1B note. Concrete vendor selection is operator work, not code work.
- ⚠️ Concrete `MastersIndiaGspProvider` etc. — explicitly deferred to Phase 1B; note in T16.6.
- ✅ Demoable milestone: sync triggers + compliance/notice rows appear → T16.4

**Placeholder scan:** No "TBD". Two acknowledged forward-deps: (a) `Notice.source_ref` may need a model+migration addition (called out in T6.4); (b) `Client.cin` may need adding (called out in T8.1). Both are explicit "if missing, do this exact migration" instructions, not handwaving.

**Type/symbol consistency:** `GSPProvider`, `MCAProvider`, `GstinReturn`, `GstinNotice`, `GstinLedgerEntry`, `GstinReco2A2B`, `CompanyStatus`, `Director`, `FormFiling` defined in T3/T5 are the names referenced in T4/T6/T7/T8/T15. `upsert_returns`, `upsert_notices`, `sync_gst_for_firm`, `sync_mca_for_firm` consistent across T6/T7/T8/T9/T10. Provider `name` strings (`"gsp.mock"`, `"mca.mock"`, `"gsp.masters_india"`) follow `<kind>.<vendor>` convention used in cost log filtering.

**Known sharp edges:**
- Task 6 introduces the first DB-using tests. If the sqlite fixture conflicts with Postgres-specific column types (UUID, JSONB) in any model, switch to testcontainers as part of T6 — don't ship a half-broken fixture.
- Tasks 13/14 frontend tasks lack TDD-style tests; manual smoke is the gate. Phase 5 will add Playwright e2e for these flows.
- `sync_gst_for_firm` swallows per-client exceptions silently. The `@metered` decorator records them, but the firm-level summary doesn't surface them. Add a `failed_clients: list[uuid]` to the summary in T7 if you want it visible — small adjustment, your call during execution.

---

## Plan complete

Plan saved to `docs/superpowers/plans/2026-05-08-phase-1-foundations.md`.

**Two execution options (same as Phase 0):**

1. **Subagent-Driven (recommended on platforms with subagent permissions)** — fresh subagent per task, fastest iteration. Phase 0 hit a permission wall on this; check whether subagents can now run bash/git before choosing.
2. **Inline Execution** — I execute task-by-task in this session with you as the review gate. Worked well for Phase 0.

**Which approach?**
