from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import date, datetime
import uuid

from app.db.database import get_db
from app.models.attendance import AttendanceLog
from app.models.user import User
from app.schemas.attendance import AttendanceCheckIn, AttendanceCheckOut, AttendanceLogResponse
from app.core.dependencies import get_current_staff

router = APIRouter()

@router.post("/check-in", response_model=AttendanceLogResponse)
async def check_in(
    data: AttendanceCheckIn,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    # Check if already checked in today
    res = await db.execute(
        select(AttendanceLog).where(
            and_(
                AttendanceLog.user_id == current_user.id,
                AttendanceLog.date == today
            )
        )
    )
    existing = res.scalar_one_or_none()
    if existing and existing.check_in:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    if existing:
        log = existing
        log.check_in = datetime.now()
    else:
        log = AttendanceLog(
            firm_id=current_user.firm_id,
            user_id=current_user.id,
            date=today,
            check_in=datetime.now()
        )
        db.add(log)
        
    log.check_in_lat = data.lat
    log.check_in_lng = data.lng
    log.work_location_type = data.work_location_type
    log.notes = data.notes
    
    await db.commit()
    await db.refresh(log)
    return log

@router.post("/check-out", response_model=AttendanceLogResponse)
async def check_out(
    data: AttendanceCheckOut,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    res = await db.execute(
        select(AttendanceLog).where(
            and_(
                AttendanceLog.user_id == current_user.id,
                AttendanceLog.date == today
            )
        )
    )
    log = res.scalar_one_or_none()
    if not log or not log.check_in:
        raise HTTPException(status_code=400, detail="Must check-in first")
    
    if log.check_out:
        raise HTTPException(status_code=400, detail="Already checked out today")
        
    log.check_out = datetime.now()
    log.check_out_lat = data.lat
    log.check_out_lng = data.lng
    if data.notes:
        log.notes = (log.notes or "") + " | Out Notes: " + data.notes
        
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/my-history", response_model=List[AttendanceLogResponse])
async def get_my_attendance(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AttendanceLog)
        .where(AttendanceLog.user_id == current_user.id)
        .order_by(AttendanceLog.date.desc())
        .limit(30)
    )
    return result.scalars().all()

@router.get("/my-history/month", response_model=List[AttendanceLogResponse])
async def get_monthly_attendance(
    year: int = Query(default=None),
    month: int = Query(default=None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    y = year or today.year
    m = month or today.month
    first_day = date(y, m, 1)
    if m == 12:
        last_day = date(y + 1, 1, 1)
    else:
        last_day = date(y, m + 1, 1)

    result = await db.execute(
        select(AttendanceLog)
        .where(
            AttendanceLog.user_id == current_user.id,
            AttendanceLog.date >= first_day,
            AttendanceLog.date < last_day,
        )
        .order_by(AttendanceLog.date.desc())
    )
    return result.scalars().all()

@router.get("/status", response_model=Optional[AttendanceLogResponse])
async def get_today_status(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    res = await db.execute(
        select(AttendanceLog).where(
            and_(
                AttendanceLog.user_id == current_user.id,
                AttendanceLog.date == today
            )
        )
    )
    return res.scalar_one_or_none()
