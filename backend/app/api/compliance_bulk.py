from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import get_db
from app.models.compliance import Compliance
from app.schemas.compliance import (
    ComplianceCreate,
    ComplianceUpdate,
    ComplianceResponse,
)
from app.core.auth import get_current_user
from app.core.rbac import admin_required
import uuid

router = APIRouter(prefix="/api/compliance-bulk", tags=["Compliance Bulk"])

class BulkComplianceUpdate(ComplianceUpdate):
    id: uuid.UUID

@router.post("/", response_model=list[ComplianceResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create(
    items: list[ComplianceCreate],
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    _: None = Depends(admin_required),
):
    """Create many compliance records in a single request (admin only)."""
    objs = [Compliance(**item.model_dump(), firm_id=user.firm_id) for item in items]
    db.add_all(objs)
    await db.commit()
    for obj in objs:
        await db.refresh(obj)
    return objs


@router.put("/", response_model=list[ComplianceResponse])
async def bulk_update(
    items: list[BulkComplianceUpdate],
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    _: None = Depends(admin_required),
):
    """Update many compliance records (admin only)."""
    updated = []
    for data in items:
        result = await db.execute(
            select(Compliance).where(
                Compliance.id == data.id, Compliance.firm_id == user.firm_id
            )
        )
        comp = result.scalar_one_or_none()
        if not comp:
            raise HTTPException(status_code=404, detail=f"Compliance {data.id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        update_data.pop("id", None)
        
        for field, value in update_data.items():
            setattr(comp, field, value)
        updated.append(comp)
    
    await db.commit()
    for comp in updated:
        await db.refresh(comp)
    return updated


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete(
    ids: list[uuid.UUID],
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    _: None = Depends(admin_required),
):
    """Delete many compliance records (admin only)."""
    await db.execute(
        delete(Compliance).where(Compliance.id.in_(ids), Compliance.firm_id == user.firm_id)
    )
    await db.commit()
    return None
