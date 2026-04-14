import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class EncryptedCredential(Base, TimestampMixin):
    __tablename__ = "encrypted_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # E.g., 'Income Tax Portal', 'MCA Portal', 'GST Portal'
    portal_name = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    
    # The symmetrically encrypted string via Fernet
    encrypted_password = Column(Text, nullable=False)
    
    notes = Column(Text, nullable=True)

    firm = relationship("Firm", back_populates="credentials")
    client = relationship("Client", back_populates="credentials")


class DSCToken(Base, TimestampMixin):
    __tablename__ = "dsc_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    holder_name = Column(String(255), nullable=False)
    expiry_date = Column(Date, nullable=False)
    
    # E.g., "Drawer 3", "Safe Box 1"
    physical_location = Column(String(255), nullable=True)
    
    # Optional password pin (encrypted)
    encrypted_pin = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)

    firm = relationship("Firm", back_populates="dsc_tokens")
    client = relationship("Client", back_populates="dsc_tokens")
