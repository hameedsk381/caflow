from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_admin, get_current_staff
from app.services.portals.engine import PortalSyncEngine
from app.models.portal_sync import PortalType
import uuid

router = APIRouter()

@router.post("/sync/{client_id}")
async def trigger_portal_sync(
    client_id: uuid.UUID,
    portal_type: PortalType,
    sync_type: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    engine = PortalSyncEngine(db)
    
    # Run in background to avoid timeout
    background_tasks.add_task(
        engine.sync_client_portal,
        firm_id=current_user.firm_id,
        client_id=client_id,
        portal_type=portal_type,
        sync_type=sync_type,
        triggered_by=current_user.id
    )
    
    return {"message": f"{portal_type.value} sync initiated for client."}

@router.get("/logs/{client_id}")
async def get_client_sync_logs(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select, desc
    from app.models.portal_sync import PortalSyncLog
    
    res = await db.execute(
        select(PortalSyncLog)
        .where(PortalSyncLog.client_id == client_id)
        .order_by(desc(PortalSyncLog.started_at))
        .limit(10)
    )
    return res.scalars().all()
