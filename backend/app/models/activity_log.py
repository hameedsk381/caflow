import uuid
from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)   # created, updated, deleted, filed, assigned
    entity_type = Column(String(50), nullable=False)  # client, compliance, task, invoice
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    entity_name = Column(String(255), nullable=True)
    details = Column(JSONB, nullable=True)

    # Relationships
    firm = relationship("Firm", back_populates="activity_logs")
    actor = relationship("User", back_populates="activity_logs", foreign_keys=[actor_id])
