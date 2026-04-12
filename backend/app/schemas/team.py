from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
import uuid
from datetime import datetime


class TeamMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    role: str
    status: str
    created_at: datetime
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "employee"
    password: str


class UpdateRoleRequest(BaseModel):
    role: str


class TeamListResponse(BaseModel):
    items: list[TeamMemberResponse]
    total: int
