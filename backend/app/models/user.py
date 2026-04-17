import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum


class UserRole(str, enum.Enum):
    firm_admin = "firm_admin"
    employee = "employee"
    client = "client"
    tax_consultant = "tax_consultant"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.employee, nullable=False)
    status = Column(SAEnum(UserStatus), default=UserStatus.active, nullable=False)

    # Relationships
    firm = relationship("Firm", back_populates="users")
    client_org = relationship("Client", foreign_keys=[client_id])
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assigned_to")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.created_by")
    assigned_compliance = relationship("Compliance", back_populates="assignee", foreign_keys="Compliance.assigned_to")
    uploaded_documents = relationship("Document", back_populates="uploader", foreign_keys="Document.uploaded_by")
    activity_logs = relationship("ActivityLog", back_populates="actor", foreign_keys="ActivityLog.actor_id")
    timesheet_logs = relationship("TimesheetLog", back_populates="user", cascade="all, delete-orphan")
    attendance_logs = relationship("AttendanceLog", back_populates="user", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.user_id", cascade="all, delete-orphan")
