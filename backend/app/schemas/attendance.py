from pydantic import BaseModel
import uuid
from typing import Optional
from datetime import datetime, date

class AttendanceCheckIn(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    work_location_type: str = "Internal"
    notes: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None

class AttendanceLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    check_in_lat: Optional[float] = None
    check_in_lng: Optional[float] = None
    check_out_lat: Optional[float] = None
    check_out_lng: Optional[float] = None
    work_location_type: Optional[str] = None
    is_present: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True
