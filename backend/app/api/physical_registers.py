from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List
import uuid

from app.db.database import get_db
from app.models.physical_register import DocumentMovement, License
from app.models.client import Client
from app.models.user import User
from app.schemas.physical_register import (
    DocumentMovementCreate, DocumentMovementResponse,
    LicenseCreate, LicenseResponse
)
from app.core.dependencies import get_current_staff

router = APIRouter()

@router.post("/documents", response_model=DocumentMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_document_movement(
    data: DocumentMovementCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    movement = DocumentMovement(firm_id=current_user.firm_id, **data.model_dump())
    db.add(movement)
    await db.commit()
    await db.refresh(movement)
    
    # Reload with joined data
    res = await db.execute(
        select(DocumentMovement)
        .options(joinedload(DocumentMovement.client), joinedload(DocumentMovement.staff))
        .where(DocumentMovement.id == movement.id)
    )
    item = res.scalar_one()
    return {
        **item.__dict__,
        "client_name": item.client.name if item.client else None,
        "staff_name": item.staff.profile.full_name if item.staff and item.staff.profile else None
    }

@router.get("/documents", response_model=List[DocumentMovementResponse])
async def list_document_movements(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DocumentMovement)
        .options(joinedload(DocumentMovement.client), joinedload(DocumentMovement.staff))
        .where(DocumentMovement.firm_id == current_user.firm_id)
        .order_by(DocumentMovement.date.desc())
    )
    items = result.scalars().all()
    return [
        {
            **i.__dict__,
            "client_name": i.client.name if i.client else None,
            "staff_name": i.staff.profile.full_name if i.staff and i.staff.profile else None
        } for i in items
    ]

@router.post("/licenses", response_model=LicenseResponse, status_code=status.HTTP_201_CREATED)
async def create_license(
    data: LicenseCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    lic = License(firm_id=current_user.firm_id, **data.model_dump())
    db.add(lic)
    await db.commit()
    await db.refresh(lic)
    
    res = await db.execute(select(License).options(joinedload(License.client)).where(License.id == lic.id))
    item = res.scalar_one()
    return {**item.__dict__, "client_name": item.client.name if item.client else None}

@router.get("/licenses", response_model=List[LicenseResponse])
async def list_licenses(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(License)
        .options(joinedload(License.client))
        .where(License.firm_id == current_user.firm_id)
        .order_by(License.expiry_date.asc())
    )
    items = result.scalars().all()
    return [{**i.__dict__, "client_name": i.client.name if i.client else None} for i in items]

@router.delete("/licenses/{license_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_license(
    license_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(License).where(License.id == license_id, License.firm_id == current_user.firm_id)
    )
    lic = result.scalar_one_or_none()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")
    await db.delete(lic)
    await db.commit()

@router.delete("/documents/{movement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_movement(
    movement_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DocumentMovement).where(DocumentMovement.id == movement_id, DocumentMovement.firm_id == current_user.firm_id)
    )
    mov = result.scalar_one_or_none()
    if not mov:
        raise HTTPException(status_code=404, detail="Movement not found")
    await db.delete(mov)
    await db.commit()
