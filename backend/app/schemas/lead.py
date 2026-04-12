from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class LeadCreate(BaseModel):
    name: str
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = "new"
    priority: Optional[str] = "medium"
    service_interest: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    expected_value: Optional[float] = None
    follow_up_date: Optional[datetime] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    service_interest: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    expected_value: Optional[float] = None
    follow_up_date: Optional[datetime] = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    name: str
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: str
    priority: str
    service_interest: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    expected_value: Optional[float] = None
    follow_up_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int
    page: int
    size: int
