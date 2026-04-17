import uuid
from sqlalchemy import Column, String, ForeignKey, Text, Enum as SAEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class CommunicationChannel(str, enum.Enum):
    email = "email"
    whatsapp = "whatsapp"
    sms = "sms"

class CommunicationTemplate(Base, TimestampMixin):
    __tablename__ = "communication_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    channel = Column(SAEnum(CommunicationChannel), default=CommunicationChannel.whatsapp, nullable=False)
    subject = Column(String(255), nullable=True) # Only for email
    body = Column(Text, nullable=False) # e.g. "Dear {{client_name}}, your {{task_title}} is due on {{due_date}}."
    
    firm = relationship("Firm")

class CommunicationLog(Base, TimestampMixin):
    __tablename__ = "communication_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True, index=True)
    
    template_id = Column(UUID(as_uuid=True), ForeignKey("communication_templates.id"), nullable=True)
    channel = Column(SAEnum(CommunicationChannel), nullable=False)
    
    sent_to = Column(String(255), nullable=False) # Email or Phone
    content = Column(Text, nullable=False)
    status = Column(String(50), default="sent") # sent, failed, delivered
    error_message = Column(Text, nullable=True)

    firm = relationship("Firm")
    client = relationship("Client", back_populates="communication_logs")
    template = relationship("CommunicationTemplate")
