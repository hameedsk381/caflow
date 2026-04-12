import uuid
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    base_price = Column(Float, default=0.0)
    billing_type = Column(String(50), default="fixed") # fixed, hourly, recurring
    turnaround_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    firm = relationship("Firm")
