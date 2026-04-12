import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class RegisterStatus(str, enum.Enum):
    pending = "pending"
    maintained = "maintained"
    overdue = "overdue"

class Register(Base, TimestampMixin):
    __tablename__ = "registers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    register_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    period = Column(String(100), nullable=True)
    status = Column(SAEnum(RegisterStatus), default=RegisterStatus.pending, nullable=False)
    maintained_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_updated_on = Column(DateTime, nullable=True)

    firm = relationship("Firm")
    client = relationship("Client")
    maintainer = relationship("User")
