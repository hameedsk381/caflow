from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.db.database import get_db
from app.models.timesheet import TimesheetLog
from app.models.user import User
from app.schemas.timesheet import TimesheetLogCreate, TimesheetLogUpdate, TimesheetLogResponse
from app.core.dependencies import get_current_staff

router = APIRouter()

@router.post("", response_model=TimesheetLogResponse, status_code=status.HTTP_201_CREATED)
async def create_timesheet_log(
    data: TimesheetLogCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    log = TimesheetLog(
        firm_id=current_user.firm_id,
        user_id=current_user.id,
        task_id=data.task_id,
        client_id=data.client_id,
        start_time=data.start_time,
        end_time=data.end_time,
        duration_hours=data.duration_hours,
        notes=data.notes
    )
    if data.end_time and not data.duration_hours:
        diff_seq = (data.end_time - data.start_time).total_seconds()
        log.duration_hours = round(diff_seq / 3600, 2)

    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.put("/{log_id}", response_model=TimesheetLogResponse)
async def update_timesheet_log(
    log_id: uuid.UUID,
    data: TimesheetLogUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(TimesheetLog).where(
        TimesheetLog.id == log_id,
        TimesheetLog.firm_id == current_user.firm_id
    ))
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Timesheet not found")
        
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(log, field, value)
        
    if data.end_time and not data.duration_hours and log.start_time:
        diff_seq = (data.end_time.replace(tzinfo=None) - log.start_time.replace(tzinfo=None)).total_seconds()
        log.duration_hours = round(diff_seq / 3600, 2)
        
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/my-logs", response_model=List[TimesheetLogResponse])
async def list_my_timesheets(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(TimesheetLog).where(
        TimesheetLog.user_id == current_user.id,
        TimesheetLog.firm_id == current_user.firm_id
    ).order_by(TimesheetLog.start_time.desc()))
    return result.scalars().all()
