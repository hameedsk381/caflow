import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Integer, Boolean, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SAEnum(TaskPriority), default=TaskPriority.medium, nullable=False)
    status = Column(SAEnum(TaskStatus), default=TaskStatus.pending, nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(Date, nullable=True)

    # Relationships
    firm = relationship("Firm", back_populates="tasks")
    client = relationship("Client", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[created_by])
    recurring_config = relationship("RecurringTaskConfig", back_populates="task", uselist=False)
    timesheet_logs = relationship("TimesheetLog", back_populates="task", cascade="all, delete-orphan")

class RecurringFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"

class RecurringTaskConfig(Base, TimestampMixin):
    __tablename__ = "recurring_task_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # The parent template task
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, unique=True)
    frequency = Column(SAEnum(RecurringFrequency), nullable=False)
    
    # Specifics on when to trigger
    interval = Column(Integer, default=1) # e.g. every 1 month
    creation_day = Column(Integer, nullable=True) # e.g. on the 5th of the month
    due_days_after_creation = Column(Integer, default=7) # Deadline offset from creation
    
    is_active = Column(Boolean, default=True)
    last_generated_at = Column(Date, nullable=True)

    task = relationship("Task", back_populates="recurring_config")
