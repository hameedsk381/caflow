from pydantic import BaseModel
import uuid
from typing import Optional
from datetime import date, datetime
from enum import Enum

class MovementType(str, Enum):
    receipt = "receipt"
    delivery = "delivery"
    internal = "internal"

class DocumentMovementBase(BaseModel):
    client_id: uuid.UUID
    document_name: str
    movement_type: MovementType
    date: date
    person_name: Optional[str] = None
    staff_id: Optional[uuid.UUID] = None
    physical_location: Optional[str] = None
    notes: Optional[str] = None

class DocumentMovementCreate(DocumentMovementBase):
    pass

class DocumentMovementResponse(DocumentMovementBase):
    id: uuid.UUID
    client_name: Optional[str] = None
    staff_name: Optional[str] = None

    class Config:
        from_attributes = True

class LicenseBase(BaseModel):
    client_id: uuid.UUID
    license_type: str
    license_number: Optional[str] = None
    expiry_date: Optional[date] = None
    remind_days: int = 30
    status: str = "Active"
    notes: Optional[str] = None

class LicenseCreate(LicenseBase):
    pass

class LicenseResponse(LicenseBase):
    id: uuid.UUID
    client_name: Optional[str] = None

    class Config:
        from_attributes = True
