from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime, date
from decimal import Decimal


class InvoiceCreate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    invoice_number: str
    description: Optional[str] = None
    amount: Decimal
    tax_amount: Decimal = Decimal("0")
    due_date: Optional[date] = None


class InvoiceUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    status: Optional[str] = None
    due_date: Optional[date] = None


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: Optional[uuid.UUID] = None
    invoice_number: str
    description: Optional[str] = None
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: str
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    size: int
