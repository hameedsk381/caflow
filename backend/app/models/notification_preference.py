import uuid
from sqlalchemy import Column, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class NotificationPreference(Base, TimestampMixin):
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    email_enabled = Column(Boolean, default=True, nullable=False)
    whatsapp_enabled = Column(Boolean, default=False, nullable=False)
    reminder_days = Column(Integer, default=7, nullable=False)

    # Relationship back to user
    user = relationship("User", back_populates="notification_preference")
