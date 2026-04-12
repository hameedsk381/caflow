from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.database import get_db
from app.models.register import Register
from app.models.user import User
from app.schemas.register import RegisterCreate, RegisterUpdate, RegisterResponse, RegisterListResponse
from app.core.dependencies import get_current_user, get_current_staff
import uuid

router = APIRouter()

@router.get("", response_model=RegisterListResponse)
async def list_registers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    client_id: uuid.UUID = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Register).where(Register.firm_id == current_user.firm_id)
    if search:
        query = query.where(
            or_(
                Register.title.ilike(f"%{search}%"),
                Register.register_type.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(Register.status == status)
    if client_id:
        query = query.where(Register.client_id == client_id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Register.created_at.desc())
    result = await db.execute(query)
    registers = result.scalars().all()
    return RegisterListResponse(items=registers, total=total, page=page, size=size)


@router.post("", response_model=RegisterResponse, status_code=201)
async def create_register(
    data: RegisterCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    register = Register(firm_id=current_user.firm_id, **data.model_dump())
    db.add(register)
    await db.commit()
    await db.refresh(register)
    return register


@router.get("/{register_id}", response_model=RegisterResponse)
async def get_register(
    register_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Register).where(Register.id == register_id, Register.firm_id == current_user.firm_id)
    )
    register = result.scalar_one_or_none()
    if not register:
        raise HTTPException(status_code=404, detail="Register not found")
    return register


@router.put("/{register_id}", response_model=RegisterResponse)
async def update_register(
    register_id: uuid.UUID,
    data: RegisterUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Register).where(Register.id == register_id, Register.firm_id == current_user.firm_id)
    )
    register = result.scalar_one_or_none()
    if not register:
        raise HTTPException(status_code=404, detail="Register not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(register, field, value)
    await db.commit()
    await db.refresh(register)
    return register


@router.delete("/{register_id}", status_code=204)
async def delete_register(
    register_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Register).where(Register.id == register_id, Register.firm_id == current_user.firm_id)
    )
    register = result.scalar_one_or_none()
    if not register:
        raise HTTPException(status_code=404, detail="Register not found")
    await db.delete(register)
    await db.commit()
