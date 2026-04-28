from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class NotificationPreferenceBase(BaseModel):
    email_enabled: bool = Field(default=True, description="Receive email notifications")
    whatsapp_enabled: bool = Field(default=False, description="Receive WhatsApp notifications")
    reminder_days: int = Field(default=3, ge=0, description="Days before due date to send reminder")

class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass

class NotificationPreferenceUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    reminder_days: Optional[int] = None

class NotificationPreferenceOut(NotificationPreferenceBase):
    id: UUID
    user_id: UUID

    class Config:
        orm_mode = True
