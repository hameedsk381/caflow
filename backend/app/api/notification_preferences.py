from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update
from app.db.database import get_db
from app.models.user import User
from app.models.notification_preference import NotificationPreference
from app.schemas.notification_preference import (
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/notification-preferences", tags=["Notification Preferences"])

@router.get("/me", response_model=NotificationPreferenceOut)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    )
    pref = result.scalar_one_or_none()
    if not pref:
        # create default preference on the fly
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return pref

@router.put("/me", response_model=NotificationPreferenceOut)
async def update_my_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    )
    pref = result.scalar_one_or_none()
    if not pref:
        # If no existing record, create one with defaults first
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    # Apply updates only for fields that are not None
    update_data = payload.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(NotificationPreference)
            .where(NotificationPreference.id == pref.id)
            .values(**update_data)
        )
        await db.commit()
        await db.refresh(pref)
    return pref
