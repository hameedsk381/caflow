from pydantic import BaseModel, Field
import uuid
from typing import Optional
from datetime import date

class CredentialCreate(BaseModel):
    client_id: uuid.UUID
    portal_name: str
    username: str
    password: str
    notes: Optional[str] = None

class CredentialResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    portal_name: str
    username: str
    notes: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

class CredentialRevealResponse(CredentialResponse):
    password: str

class DSCTokenCreate(BaseModel):
    client_id: uuid.UUID
    holder_name: str
    expiry_date: date
    physical_location: Optional[str] = None
    pin: Optional[str] = None

class DSCTokenResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    holder_name: str
    expiry_date: date
    physical_location: Optional[str] = None
    is_active: bool
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

class DSCTokenRevealResponse(DSCTokenResponse):
    pin: Optional[str] = None
