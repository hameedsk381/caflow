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
