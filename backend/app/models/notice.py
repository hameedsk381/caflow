import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class NoticeStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    responded = "responded"
    closed = "closed"

class NoticePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class Notice(Base, TimestampMixin):
    __tablename__ = "notices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    notice_type = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    reference_no = Column(String(100), nullable=True)
    issue_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(SAEnum(NoticeStatus), default=NoticeStatus.open, nullable=False)
    priority = Column(SAEnum(NoticePriority), default=NoticePriority.medium, nullable=False)
    description = Column(Text, nullable=True)
    response_summary = Column(Text, nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    attachment_url = Column(String(255), nullable=True)

    firm = relationship("Firm")
    client = relationship("Client")
    assignee = relationship("User")
