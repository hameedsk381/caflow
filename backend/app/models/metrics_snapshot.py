import uuid
from sqlalchemy import Column, Float, Integer, Date, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base, TimestampMixin

class MetricsSnapshot(Base, TimestampMixin):
    __tablename__ = "metrics_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    
    # Core KPIs
    total_revenue = Column(Float, default=0.0)
    outstanding_amount = Column(Float, default=0.0)
    total_clients = Column(Integer, default=0)
    filing_rate = Column(Float, default=0.0) # Percentage
    
    # Detailed breakdown for charts
    details = Column(JSON, nullable=True) # e.g. {"gst_filed": 10, "it_filed": 5}
