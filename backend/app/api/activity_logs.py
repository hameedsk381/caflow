from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import joinedload
from app.db.database import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.core.rbac import admin_required

router = APIRouter()

@router.get("/")
async def list_activity_logs(
    current_user: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    entity_type: Optional[str] = None,
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
):
    query = select(ActivityLog).where(ActivityLog.firm_id == current_user.firm_id)
    
    if entity_type:
        query = query.where(ActivityLog.entity_type == entity_type)
    if actor_id:
        query = query.where(ActivityLog.actor_id == actor_id)
    if action:
        query = query.where(ActivityLog.action == action)
        
    # Count total
    total_query = select(func.count(ActivityLog.id)).where(ActivityLog.firm_id == current_user.firm_id)
    if entity_type: total_query = total_query.where(ActivityLog.entity_type == entity_type)
    if actor_id: total_query = total_query.where(ActivityLog.actor_id == actor_id)
    if action: total_query = total_query.where(ActivityLog.action == action)
    
    total = (await db.execute(total_query)).scalar()
    
    # Execute paginated query
    query = query.options(joinedload(ActivityLog.actor).joinedload(User.profile))
    query = query.order_by(desc(ActivityLog.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    items = []
    for log in logs:
        actor_name = "System"
        if log.actor and getattr(log.actor, "profile", None):
            actor_name = log.actor.profile.name

        items.append({
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_name": log.entity_name,
            "actor_name": actor_name,
            "created_at": log.created_at.isoformat(),
            "details": log.details
        })
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
