from pydantic import BaseModel
import uuid
from typing import Optional
from datetime import datetime

class TimesheetLogCreate(BaseModel):
    task_id: Optional[uuid.UUID] = None
    client_id: Optional[uuid.UUID] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_hours: Optional[float] = None
    notes: Optional[str] = None

class TimesheetLogUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration_hours: Optional[float] = None
    notes: Optional[str] = None

class TimesheetLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    task_id: Optional[uuid.UUID]
    client_id: Optional[uuid.UUID]
    start_time: datetime
    end_time: Optional[datetime]
    duration_hours: Optional[float]
    notes: Optional[str]
    client_name: Optional[str] = None
    task_title: Optional[str] = None

    class Config:
        from_attributes = True
