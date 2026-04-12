from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.database import get_db
from app.models.notice import Notice
from app.models.user import User
from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeResponse, NoticeListResponse
from app.core.dependencies import get_current_user, get_current_staff
import uuid

router = APIRouter()

@router.get("", response_model=NoticeListResponse)
async def list_notices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    client_id: uuid.UUID = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notice).where(Notice.firm_id == current_user.firm_id)
    if search:
        query = query.where(
            or_(
                Notice.reference_no.ilike(f"%{search}%"),
                Notice.notice_type.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(Notice.status == status)
    if client_id:
        query = query.where(Notice.client_id == client_id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Notice.created_at.desc())
    result = await db.execute(query)
    notices = result.scalars().all()
    return NoticeListResponse(items=notices, total=total, page=page, size=size)


@router.post("", response_model=NoticeResponse, status_code=201)
async def create_notice(
    data: NoticeCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    notice = Notice(firm_id=current_user.firm_id, **data.model_dump())
    db.add(notice)
    await db.commit()
    await db.refresh(notice)
    return notice


@router.get("/{notice_id}", response_model=NoticeResponse)
async def get_notice(
    notice_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notice).where(Notice.id == notice_id, Notice.firm_id == current_user.firm_id)
    )
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    return notice


@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: uuid.UUID,
    data: NoticeUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notice).where(Notice.id == notice_id, Notice.firm_id == current_user.firm_id)
    )
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(notice, field, value)
    await db.commit()
    await db.refresh(notice)
    return notice


@router.delete("/{notice_id}", status_code=204)
async def delete_notice(
    notice_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notice).where(Notice.id == notice_id, Notice.firm_id == current_user.firm_id)
    )
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    await db.delete(notice)
    await db.commit()
