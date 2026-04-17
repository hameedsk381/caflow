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

from app.models.client import Client
from app.models.task import Task
from sqlalchemy.orm import joinedload

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
    
    # Reload with joined data for response
    res = await db.execute(
        select(TimesheetLog)
        .options(joinedload(TimesheetLog.client), joinedload(TimesheetLog.task))
        .where(TimesheetLog.id == log.id)
    )
    log_with_data = res.scalar_one()
    
    return {
        **log_with_data.__dict__,
        "client_name": log_with_data.client.name if log_with_data.client else None,
        "task_title": log_with_data.task.title if log_with_data.task else None
    }

@router.put("/{log_id}", response_model=TimesheetLogResponse)
async def update_timesheet_log(
    log_id: uuid.UUID,
    data: TimesheetLogUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TimesheetLog)
        .options(joinedload(TimesheetLog.client), joinedload(TimesheetLog.task))
        .where(
            TimesheetLog.id == log_id,
            TimesheetLog.firm_id == current_user.firm_id
        )
    )
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
    
    return {
        **log.__dict__,
        "client_name": log.client.name if log.client else None,
        "task_title": log.task.title if log.task else None
    }

@router.get("", response_model=List[TimesheetLogResponse])
async def list_all_timesheets(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TimesheetLog)
        .options(joinedload(TimesheetLog.client), joinedload(TimesheetLog.task))
        .where(TimesheetLog.firm_id == current_user.firm_id)
        .order_by(TimesheetLog.start_time.desc())
    )
    items = result.scalars().all()
    return [
        {
            **item.__dict__,
            "client_name": item.client.name if item.client else None,
            "task_title": item.task.title if item.task else None
        } for item in items
    ]

@router.get("/my-logs", response_model=List[TimesheetLogResponse])
async def list_my_timesheets(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TimesheetLog)
        .options(joinedload(TimesheetLog.client), joinedload(TimesheetLog.task))
        .where(
            TimesheetLog.user_id == current_user.id,
            TimesheetLog.firm_id == current_user.firm_id
        )
        .order_by(TimesheetLog.start_time.desc())
    )
    items = result.scalars().all()
    return [
        {
            **item.__dict__,
            "client_name": item.client.name if item.client else None,
            "task_title": item.task.title if item.task else None
        } for item in items
    ]

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timesheet_log(
    log_id: uuid.UUID,
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
        
    await db.delete(log)
    await db.commit()
    return None
