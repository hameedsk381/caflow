from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    firm_id: uuid.UUID
    title: str
    message: Optional[str] = None
    type: str
    is_read: bool
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int
