from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.database import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse, ServiceListResponse
from app.core.dependencies import get_current_user, get_current_staff
import uuid

router = APIRouter()

@router.get("", response_model=ServiceListResponse)
async def list_services(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Service).where(Service.firm_id == current_user.firm_id)
    if search:
        query = query.where(
            or_(
                Service.name.ilike(f"%{search}%"),
                Service.code.ilike(f"%{search}%"),
            )
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Service.created_at.desc())
    result = await db.execute(query)
    services = result.scalars().all()
    return ServiceListResponse(items=services, total=total, page=page, size=size)


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    data: ServiceCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    service = Service(firm_id=current_user.firm_id, **data.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.firm_id == current_user.firm_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: uuid.UUID,
    data: ServiceUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.firm_id == current_user.firm_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    await db.commit()
    await db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.firm_id == current_user.firm_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(service)
    await db.commit()
