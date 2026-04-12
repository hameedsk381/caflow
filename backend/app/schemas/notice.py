from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class NoticeCreate(BaseModel):
    client_id: uuid.UUID
    notice_type: str
    department: Optional[str] = None
    reference_no: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "open"
    priority: Optional[str] = "medium"
    description: Optional[str] = None
    response_summary: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    attachment_url: Optional[str] = None


class NoticeUpdate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    notice_type: Optional[str] = None
    department: Optional[str] = None
    reference_no: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    response_summary: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    attachment_url: Optional[str] = None


class NoticeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: uuid.UUID
    notice_type: str
    department: Optional[str] = None
    reference_no: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: str
    priority: str
    description: Optional[str] = None
    response_summary: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    attachment_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class NoticeListResponse(BaseModel):
    items: list[NoticeResponse]
    total: int
    page: int
    size: int
