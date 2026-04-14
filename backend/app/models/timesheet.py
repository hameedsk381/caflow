import uuid
from sqlalchemy import Column, ForeignKey, DateTime, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class TimesheetLog(Base, TimestampMixin):
    __tablename__ = "timesheet_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True, index=True)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Pre-calculated decimal hours (e.g., 1.5 hours)
    duration_hours = Column(Float, nullable=True)
    
    notes = Column(Text, nullable=True)

    firm = relationship("Firm", back_populates="timesheet_logs")
    user = relationship("User", back_populates="timesheet_logs")
    task = relationship("Task", back_populates="timesheet_logs")
    client = relationship("Client", back_populates="timesheet_logs")
