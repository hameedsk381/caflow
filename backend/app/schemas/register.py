from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class RegisterCreate(BaseModel):
    client_id: uuid.UUID
    register_type: str
    title: str
    description: Optional[str] = None
    period: Optional[str] = None
    status: Optional[str] = "pending"
    maintained_by: Optional[uuid.UUID] = None
    last_updated_on: Optional[datetime] = None


class RegisterUpdate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    register_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    period: Optional[str] = None
    status: Optional[str] = None
    maintained_by: Optional[uuid.UUID] = None
    last_updated_on: Optional[datetime] = None


class RegisterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: uuid.UUID
    register_type: str
    title: str
    description: Optional[str] = None
    period: Optional[str] = None
    status: str
    maintained_by: Optional[uuid.UUID] = None
    last_updated_on: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class RegisterListResponse(BaseModel):
    items: list[RegisterResponse]
    total: int
    page: int
    size: int
