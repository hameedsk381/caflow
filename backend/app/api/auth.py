from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.firm import Firm
from app.models.user import User
from app.models.profile import Profile
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, UserResponse, UpdateProfileRequest, ChangePasswordRequest
)
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)
from app.core.dependencies import get_current_user
import uuid

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create firm
    firm = Firm(name=data.firm_name)
    db.add(firm)
    await db.flush()

    # Create admin user
    user = User(
        firm_id=firm.id,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role="firm_admin",
        status="active",
    )
    db.add(user)
    await db.flush()

    # Create profile
    profile = Profile(user_id=user.id, name=data.name)
    db.add(profile)
    await db.commit()

    token_data = {"sub": str(user.id), "firm_id": str(firm.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is not active")

    token_data = {"sub": str(user.id), "firm_id": str(user.firm_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {"sub": str(user.id), "firm_id": str(user.firm_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    # Load profile
    prof_result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    user.profile = prof_result.scalar_one_or_none()
    return user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prof_result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = prof_result.scalar_one_or_none()
    if not profile:
        profile = Profile(user_id=current_user.id, name=data.name or "")
        db.add(profile)
    else:
        if data.name is not None:
            profile.name = data.name
        if data.phone is not None:
            profile.phone = data.phone
        if data.avatar is not None:
            profile.avatar = data.avatar
    await db.commit()

    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    prof_result2 = await db.execute(select(Profile).where(Profile.user_id == user.id))
    user.profile = prof_result2.scalar_one_or_none()
    return user


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}
