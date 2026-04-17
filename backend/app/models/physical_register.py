import uuid
from sqlalchemy import Column, String, ForeignKey, Date, DateTime, Text, Enum as SAEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin
import enum

class MovementType(str, enum.Enum):
    receipt = "receipt"  # Incoming from client
    delivery = "delivery"  # Handed back to client
    internal = "internal" # Internal movement between staff

class DocumentMovement(Base, TimestampMixin):
    __tablename__ = "document_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    document_name = Column(String(255), nullable=False) # e.g. "Original Sale Deed"
    movement_type = Column(SAEnum(MovementType), nullable=False)
    
    date = Column(Date, nullable=False)
    person_name = Column(String(255), nullable=True) # Who delivered/received
    
    # Staff handling the movement
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    physical_location = Column(String(255), nullable=True) # e.g. "Shelf B-1"
    notes = Column(Text, nullable=True)

    firm = relationship("Firm")
    client = relationship("Client", back_populates="document_movements")
    staff = relationship("User")

class License(Base, TimestampMixin):
    __tablename__ = "licenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    license_type = Column(String(100), nullable=False) # e.g. "FSSAI", "PF", "ESI"
    license_number = Column(String(255), nullable=True)
    
    expiry_date = Column(Date, nullable=True)
    remind_days = Column(Integer, default=30)
    
    status = Column(String(50), default="Active") # Active, Expired, Renewing
    notes = Column(Text, nullable=True)

    firm = relationship("Firm")
    client = relationship("Client", back_populates="licenses")
