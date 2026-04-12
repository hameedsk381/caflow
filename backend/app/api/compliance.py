from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.compliance import Compliance
from app.models.client import Client
from app.models.profile import Profile
from app.models.user import User
from app.schemas.compliance import ComplianceCreate, ComplianceUpdate, ComplianceResponse, ComplianceListResponse
from app.core.dependencies import get_current_user, get_current_staff
import uuid
from datetime import date

router = APIRouter()


@router.get("", response_model=ComplianceListResponse)
async def list_compliance(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    client_id: uuid.UUID = Query(None),
    status: str = Query(None),
    type: str = Query(None),
    overdue: bool = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Compliance).where(Compliance.firm_id == current_user.firm_id)
    if client_id:
        query = query.where(Compliance.client_id == client_id)
    if status:
        query = query.where(Compliance.status == status)
    if type:
        query = query.where(Compliance.type == type)
    if overdue:
        query = query.where(Compliance.due_date < date.today(), Compliance.status != "filed")

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Compliance.due_date.asc())
    result = await db.execute(query)
    records = result.scalars().all()

    items = []
    for rec in records:
        r = ComplianceResponse.model_validate(rec)
        # Enrich with client name
        c_res = await db.execute(select(Client).where(Client.id == rec.client_id))
        client = c_res.scalar_one_or_none()
        if client:
            r.client_name = client.name
        # Enrich with assignee name
        if rec.assigned_to:
            p_res = await db.execute(select(Profile).where(Profile.user_id == rec.assigned_to))
            prof = p_res.scalar_one_or_none()
            if prof:
                r.assignee_name = prof.name
        items.append(r)

    return ComplianceListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=ComplianceResponse, status_code=201)
async def create_compliance(
    data: ComplianceCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    # Verify client belongs to firm
    c_res = await db.execute(
        select(Client).where(Client.id == data.client_id, Client.firm_id == current_user.firm_id)
    )
    if not c_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    compliance = Compliance(firm_id=current_user.firm_id, **data.model_dump())
    db.add(compliance)
    await db.commit()
    await db.refresh(compliance)
    return compliance


@router.get("/{compliance_id}", response_model=ComplianceResponse)
async def get_compliance(
    compliance_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Compliance).where(
            Compliance.id == compliance_id,
            Compliance.firm_id == current_user.firm_id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Compliance record not found")
    return rec


@router.put("/{compliance_id}", response_model=ComplianceResponse)
async def update_compliance(
    compliance_id: uuid.UUID,
    data: ComplianceUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Compliance).where(
            Compliance.id == compliance_id,
            Compliance.firm_id == current_user.firm_id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Compliance record not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rec, field, value)
    await db.commit()
    await db.refresh(rec)
    return rec


@router.delete("/{compliance_id}", status_code=204)
async def delete_compliance(
    compliance_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Compliance).where(
            Compliance.id == compliance_id,
            Compliance.firm_id == current_user.firm_id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Compliance record not found")
    await db.delete(rec)
    await db.commit()
