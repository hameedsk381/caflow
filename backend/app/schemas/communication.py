from pydantic import BaseModel
import uuid
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CommunicationChannel(str, Enum):
    email = "email"
    whatsapp = "whatsapp"
    sms = "sms"

class CommunicationTemplateBase(BaseModel):
    name: str
    channel: CommunicationChannel
    subject: Optional[str] = None
    body: str

class CommunicationTemplateCreate(CommunicationTemplateBase):
    pass

class CommunicationTemplateResponse(CommunicationTemplateBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class CommunicationLogBase(BaseModel):
    client_id: Optional[uuid.UUID] = None
    template_id: Optional[uuid.UUID] = None
    channel: CommunicationChannel
    sent_to: str
    content: str
    status: str = "sent"
    error_message: Optional[str] = None

class CommunicationLogResponse(CommunicationLogBase):
    id: uuid.UUID
    created_at: datetime
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

class SendManualMessage(BaseModel):
    client_id: uuid.UUID
    template_id: uuid.UUID
