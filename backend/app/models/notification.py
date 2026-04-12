import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    type = Column(String(50), default="info")  # info, warning, reminder, alert
    is_read = Column(Boolean, default=False)
    entity_type = Column(String(50), nullable=True)  # compliance, task, invoice
    entity_id = Column(UUID(as_uuid=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
