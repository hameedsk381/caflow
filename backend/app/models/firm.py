import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class Firm(Base, TimestampMixin):
    __tablename__ = "firms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, nullable=True)
    plan = Column(String(50), default="free")  # free, pro, enterprise
    is_active = Column(Boolean, default=True)

    # Relationships
    users = relationship("User", back_populates="firm", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="firm", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="firm", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="firm", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="firm", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="firm", cascade="all, delete-orphan")
    notification_rules = relationship("NotificationRule", back_populates="firm", cascade="all, delete-orphan")
    credentials = relationship("EncryptedCredential", back_populates="firm", cascade="all, delete-orphan")
    dsc_tokens = relationship("DSCToken", back_populates="firm", cascade="all, delete-orphan")
    timesheet_logs = relationship("TimesheetLog", back_populates="firm", cascade="all, delete-orphan")
