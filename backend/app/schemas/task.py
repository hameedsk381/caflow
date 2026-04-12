from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime, date


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    client_id: Optional[uuid.UUID] = None
    priority: Optional[str] = "medium"
    assigned_to: Optional[uuid.UUID] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[uuid.UUID] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None
    assignee_name: Optional[str] = None


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    size: int
