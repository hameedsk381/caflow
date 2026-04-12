from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.schemas.team import TeamMemberResponse, InviteMemberRequest, UpdateRoleRequest, TeamListResponse
from app.core.dependencies import get_current_admin, get_current_staff
from app.core.security import get_password_hash
import uuid

router = APIRouter()


@router.get("", response_model=TeamListResponse)
async def list_team(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.firm_id == current_user.firm_id).order_by(User.created_at.asc())
    )
    users = result.scalars().all()

    items = []
    for u in users:
        p_res = await db.execute(select(Profile).where(Profile.user_id == u.id))
        profile = p_res.scalar_one_or_none()
        member = TeamMemberResponse.model_validate(u)
        if profile:
            member.name = profile.name
            member.phone = profile.phone
            member.avatar = profile.avatar
        items.append(member)

    return TeamListResponse(items=items, total=len(items))


@router.post("/invite", response_model=TeamMemberResponse, status_code=201)
async def invite_member(
    data: InviteMemberRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Check email not already used
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        firm_id=current_user.firm_id,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role,
        status="active",
    )
    db.add(user)
    await db.flush()

    profile = Profile(user_id=user.id, name=data.name)
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    member = TeamMemberResponse.model_validate(user)
    member.name = profile.name
    return member


@router.put("/{user_id}/role", response_model=TeamMemberResponse)
async def update_role(
    user_id: uuid.UUID,
    data: UpdateRoleRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.firm_id == current_user.firm_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid_roles = ["firm_admin", "employee", "tax_consultant", "client"]
    if data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def remove_member(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    result = await db.execute(
        select(User).where(User.id == user_id, User.firm_id == current_user.firm_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "inactive"
    await db.commit()
