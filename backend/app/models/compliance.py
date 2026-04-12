import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum


class ComplianceType(str, enum.Enum):
    GST = "GST"
    ITR = "ITR"
    TDS = "TDS"
    ROC = "ROC"
    PT = "PT"
    OTHER = "OTHER"


class ComplianceStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    filed = "filed"
    overdue = "overdue"


class Compliance(Base, TimestampMixin):
    __tablename__ = "compliance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    type = Column(SAEnum(ComplianceType), nullable=False)
    period = Column(String(50), nullable=True)   # e.g. "Q1 FY2024-25", "FY 2023-24"
    due_date = Column(Date, nullable=False)
    status = Column(SAEnum(ComplianceStatus), default=ComplianceStatus.pending, nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    filing_reference = Column(String(100), nullable=True)

    # Relationships
    client = relationship("Client", back_populates="compliance")
    assignee = relationship("User", back_populates="assigned_compliance", foreign_keys=[assigned_to])
