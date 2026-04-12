import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    won = "won"
    lost = "lost"

class LeadPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    source = Column(String(100), nullable=True)
    status = Column(SAEnum(LeadStatus), default=LeadStatus.new, nullable=False)
    priority = Column(SAEnum(LeadPriority), default=LeadPriority.medium, nullable=False)
    service_interest = Column(String(255), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    expected_value = Column(Float, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)

    firm = relationship("Firm")
    assignee = relationship("User")
