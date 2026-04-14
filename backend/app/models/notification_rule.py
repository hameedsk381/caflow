import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum


class NotificationChannel(str, enum.Enum):
    email = "email"
    whatsapp = "whatsapp"
    sms = "sms"


class TriggerEvent(str, enum.Enum):
    task_created = "task_created"
    task_due_soon = "task_due_soon"
    task_overdue = "task_overdue"
    compliance_due_soon = "compliance_due_soon"
    document_signature_requested = "document_signature_requested"


class NotificationRule(Base, TimestampMixin):
    __tablename__ = "notification_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    channel = Column(SAEnum(NotificationChannel), default=NotificationChannel.whatsapp, nullable=False)
    trigger_event = Column(SAEnum(TriggerEvent), nullable=False)
    
    # E.g., trigger 3 days before due date
    days_offset = Column(Integer, default=0, nullable=False)
    
    # Customizable message template string (variables like {{client_name}} and {{task_title}})
    message_template = Column(String(1000), nullable=True)
    
    is_active = Column(Boolean, default=True)

    firm = relationship("Firm", back_populates="notification_rules")
