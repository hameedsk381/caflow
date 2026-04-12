from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime, date


class ComplianceCreate(BaseModel):
    client_id: uuid.UUID
    type: str  # GST, ITR, TDS, ROC, PT, OTHER
    period: Optional[str] = None
    due_date: date
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class ComplianceUpdate(BaseModel):
    type: Optional[str] = None
    period: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    filing_reference: Optional[str] = None


class ComplianceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: uuid.UUID
    type: str
    period: Optional[str] = None
    due_date: date
    status: str
    assigned_to: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    filing_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None
    assignee_name: Optional[str] = None


class ComplianceListResponse(BaseModel):
    items: list[ComplianceResponse]
    total: int
    page: int
    size: int
