from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class ServiceCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = 0.0
    billing_type: Optional[str] = "fixed"
    turnaround_days: Optional[int] = None
    is_active: Optional[bool] = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = None
    billing_type: Optional[str] = None
    turnaround_days: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: float
    billing_type: str
    turnaround_days: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ServiceListResponse(BaseModel):
    items: list[ServiceResponse]
    total: int
    page: int
    size: int
