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
