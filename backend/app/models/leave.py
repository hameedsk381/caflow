import uuid
import enum
from sqlalchemy import Column, String, ForeignKey, Date, DateTime, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class LeaveType(str, enum.Enum):
    casual = "casual"
    sick = "sick"
    annual = "annual"
    compensatory = "compensatory"
    wfh = "wfh"
    half_day = "half_day"


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    leave_type = Column(SAEnum(LeaveType), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(SAEnum(LeaveStatus), default=LeaveStatus.pending, nullable=False)

    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="leave_requests", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
