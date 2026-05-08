"""Admin-only endpoints for ops visibility (per-firm cost log, system status).

All routes require firm_admin role. Surfaced under /api/admin.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin
from app.db.database import get_db
from app.models.provider_call_log import ProviderCallLog
from app.models.user import User

router = APIRouter()


@router.get("/provider-calls")
async def list_provider_calls(
    limit: int = Query(100, le=1000),
    provider: str | None = None,
    firm_id: str | None = None,
    since: datetime | None = None,
    user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    stmt = (
        select(ProviderCallLog)
        .order_by(ProviderCallLog.created_at.desc())
        .limit(limit)
    )
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
            "firm_id": str(r.firm_id) if r.firm_id else None,
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
