from pydantic import BaseModel
import uuid
from datetime import date, datetime
from typing import Optional
from enum import Enum

class LeaveType(str, Enum):
    casual = "casual"
    sick = "sick"
    annual = "annual"
    compensatory = "compensatory"
    wfh = "wfh"
    half_day = "half_day"

class LeaveStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType
    from_date: date
    to_date: date
    reason: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: uuid.UUID
    firm_id: uuid.UUID
    user_id: uuid.UUID
    leave_type: LeaveType
    from_date: date
    to_date: date
    reason: Optional[str] = None
    status: LeaveStatus
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    # Extra fields for UI
    user_name: Optional[str] = None
    approver_name: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveApproval(BaseModel):
    status: LeaveStatus # approved or rejected
