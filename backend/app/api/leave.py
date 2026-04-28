from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List
import uuid
from datetime import datetime

from app.db.database import get_db
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.user import User
from app.schemas.leave import LeaveRequestCreate, LeaveRequestResponse, LeaveApproval
from app.core.dependencies import get_current_staff, require_permission
from app.core.rbac import Permissions
from sqlalchemy.orm import joinedload

router = APIRouter()

@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    data: LeaveRequestCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    leave = LeaveRequest(
        firm_id=current_user.firm_id,
        user_id=current_user.id,
        leave_type=data.leave_type,
        from_date=data.from_date,
        to_date=data.to_date,
        reason=data.reason,
        status=LeaveStatus.pending
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    
    # Reload with user info
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user))
        .where(LeaveRequest.id == leave.id)
    )
    new_leave = res.scalar_one()
    return {
        **new_leave.__dict__,
        "user_name": new_leave.user.profile.name if new_leave.user.profile else new_leave.user.email
    }

@router.get("/my-requests", response_model=List[LeaveRequestResponse])
async def get_my_leaves(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user))
        .where(LeaveRequest.user_id == current_user.id)
        .order_by(desc(LeaveRequest.created_at))
    )
    items = result.scalars().all()
    return [{
        **i.__dict__,
        "user_name": i.user.profile.name if i.user.profile else i.user.email
    } for i in items]

@router.get("/firm-requests", response_model=List[LeaveRequestResponse])
async def get_firm_leaves(
    current_user: User = Depends(require_permission(Permissions.MANAGE_TEAM)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user))
        .where(LeaveRequest.firm_id == current_user.firm_id)
        .order_by(desc(LeaveRequest.created_at))
    )
    items = result.scalars().all()
    return [{
        **i.__dict__,
        "user_name": i.user.profile.name if i.user.profile else i.user.email
    } for i in items]

@router.post("/{leave_id}/approve", response_model=LeaveRequestResponse)
async def approve_leave(
    leave_id: uuid.UUID,
    data: LeaveApproval,
    current_user: User = Depends(require_permission(Permissions.MANAGE_TEAM)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user))
        .where(
            LeaveRequest.id == leave_id,
            LeaveRequest.firm_id == current_user.firm_id
        )
    )
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave.status != LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Leave request already processed")
        
    leave.status = data.status
    leave.approved_by = current_user.id
    leave.approved_at = datetime.now()
    
    await db.commit()
    await db.refresh(leave)
    
    return {
        **leave.__dict__,
        "user_name": leave.user.profile.name if leave.user.profile else leave.user.email,
        "approver_name": current_user.profile.name if current_user.profile else current_user.email
    }

@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_leave(
    leave_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LeaveRequest).where(
            LeaveRequest.id == leave_id,
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status == LeaveStatus.pending
        )
    )
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Pending leave request not found")
        
    await db.delete(leave)
    await db.commit()
