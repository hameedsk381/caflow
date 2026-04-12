from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class RegisterRequest(BaseModel):
    firm_name: str
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    email: str
    role: str
    status: str
    created_at: datetime
    profile: Optional[ProfileSchema] = None


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user: UserResponse
    firm_name: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
