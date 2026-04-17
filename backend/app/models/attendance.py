import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class AttendanceLog(Base, TimestampMixin):
    __tablename__ = "attendance_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    
    # Geo-coordinates for field visits/office tracking
    check_in_lat = Column(Float, nullable=True)
    check_in_lng = Column(Float, nullable=True)
    check_out_lat = Column(Float, nullable=True)
    check_out_lng = Column(Float, nullable=True)
    
    # E.g., 'Internal', 'Client Visit', 'Home'
    work_location_type = Column(String(50), nullable=True)
    
    is_present = Column(Boolean, default=True)
    notes = Column(String(500), nullable=True)

    firm = relationship("Firm")
    user = relationship("User", back_populates="attendance_logs")
