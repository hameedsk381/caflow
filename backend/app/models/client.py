import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum


class ClientStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), nullable=True)
    pan = Column(String(10), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    status = Column(SAEnum(ClientStatus), default=ClientStatus.active, nullable=False)
    business_type = Column(String(100), nullable=True)  # Proprietorship, Partnership, PvtLtd, etc.
    notes = Column(Text, nullable=True)

    # Relationships
    firm = relationship("Firm", back_populates="clients")
    compliance = relationship("Compliance", back_populates="client", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="client")
    documents = relationship("Document", back_populates="client")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
