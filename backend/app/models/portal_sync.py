from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime
import enum

class SyncStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class PortalType(str, enum.Enum):
    GST = "GST"
    MCA = "MCA"
    INCOME_TAX = "Income Tax"
    TRACES = "Traces"
    ICEGATE = "Icegate"

class PortalSyncLog(Base):
    __tablename__ = "portal_sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    portal_type = Column(SQLEnum(PortalType), nullable=False)
    status = Column(SQLEnum(SyncStatus), default=SyncStatus.PENDING)
    
    # What was fetched?
    sync_type = Column(String, nullable=False) # e.g., "return_status", "ledger_balance", "profile_update"
    
    # Results and Errors
    result_data = Column(JSON, nullable=True)
    error_message = Column(String, nullable=True)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Who triggered it
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
