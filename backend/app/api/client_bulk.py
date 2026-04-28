from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import get_db
from app.models.client import Client
from app.schemas.client import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
)
from app.core.dependencies import get_db, get_current_user, get_current_admin
import uuid

router = APIRouter(prefix="/api/client-bulk", tags=["Client Bulk"])

class BulkClientUpdate(ClientUpdate):
    id: uuid.UUID

@router.post("/", response_model=list[ClientResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create(
    items: list[ClientCreate],
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    _: None = Depends(get_current_admin),
):
    """Create many client records in a single request (admin only)."""
    objs = [Client(**item.model_dump(), firm_id=user.firm_id) for item in items]
    db.add_all(objs)
    await db.commit()
    for obj in objs:
        await db.refresh(obj)
    return objs

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete(
    ids: list[uuid.UUID],
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    _: None = Depends(get_current_admin),
):
    """Delete many client records (admin only)."""
    await db.execute(
        delete(Client).where(Client.id.in_(ids), Client.firm_id == user.firm_id)
    )
    await db.commit()
    return None
