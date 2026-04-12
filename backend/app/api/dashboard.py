from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.invoice import Invoice
from app.models.activity_log import ActivityLog
from app.models.profile import Profile
from app.models.user import User
from app.core.dependencies import get_current_staff
from datetime import date, timedelta
from app.models.lead import Lead
from app.models.service import Service
from app.models.notice import Notice
from app.models.register import Register

router = APIRouter()


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id

    total_clients = (await db.execute(
        select(func.count(Client.id)).where(Client.firm_id == firm_id, Client.status == "active")
    )).scalar()

    pending_compliance = (await db.execute(
        select(func.count(Compliance.id)).where(
            Compliance.firm_id == firm_id,
            Compliance.status.in_(["pending", "in_progress"])
        )
    )).scalar()

    overdue_compliance = (await db.execute(
        select(func.count(Compliance.id)).where(
            Compliance.firm_id == firm_id,
            Compliance.due_date < date.today(),
            Compliance.status != "filed"
        )
    )).scalar()

    open_tasks = (await db.execute(
        select(func.count(Task.id)).where(
            Task.firm_id == firm_id,
            Task.status.in_(["pending", "in_progress"])
        )
    )).scalar()

    total_revenue_result = await db.execute(
        select(func.sum(Invoice.total_amount)).where(
            Invoice.firm_id == firm_id,
            Invoice.status == "paid"
        )
    )
    total_revenue = float(total_revenue_result.scalar() or 0)

    pending_invoices = (await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.firm_id == firm_id,
            Invoice.status.in_(["sent", "overdue"])
        )
    )).scalar()

    total_leads = (await db.execute(
        select(func.count(Lead.id)).where(Lead.firm_id == firm_id)
    )).scalar()

    active_services = (await db.execute(
        select(func.count(Service.id)).where(Service.firm_id == firm_id, Service.is_active == True)
    )).scalar()

    overdue_notices = (await db.execute(
        select(func.count(Notice.id)).where(Notice.firm_id == firm_id, Notice.due_date < func.now(), Notice.status != "closed")
    )).scalar()
    
    total_registers = (await db.execute(
        select(func.count(Register.id)).where(Register.firm_id == firm_id)
    )).scalar()

    return {
        "total_clients": total_clients,
        "pending_compliance": pending_compliance,
        "overdue_compliance": overdue_compliance,
        "open_tasks": open_tasks,
        "total_revenue": total_revenue,
        "pending_invoices": pending_invoices,
        "total_leads": total_leads,
        "active_services": active_services,
        "overdue_notices": overdue_notices,
        "total_registers": total_registers,
    }


@router.get("/upcoming-deadlines")
async def get_upcoming_deadlines(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id
    today = date.today()
    in_30_days = today + timedelta(days=30)

    result = await db.execute(
        select(Compliance).where(
            Compliance.firm_id == firm_id,
            Compliance.due_date >= today,
            Compliance.due_date <= in_30_days,
            Compliance.status != "filed"
        ).order_by(Compliance.due_date.asc()).limit(10)
    )
    compliance_list = result.scalars().all()

    deadlines = []
    for c in compliance_list:
        client_res = await db.execute(select(Client).where(Client.id == c.client_id))
        client = client_res.scalar_one_or_none()
        deadlines.append({
            "id": str(c.id),
            "type": c.type,
            "period": c.period,
            "due_date": str(c.due_date),
            "status": c.status,
            "client_name": client.name if client else "Unknown",
            "days_remaining": (c.due_date - today).days,
        })

    return {"deadlines": deadlines}


@router.get("/compliance-summary")
async def get_compliance_summary(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id

    statuses = ["pending", "in_progress", "filed", "overdue"]
    summary = {}
    for s in statuses:
        count = (await db.execute(
            select(func.count(Compliance.id)).where(
                Compliance.firm_id == firm_id,
                Compliance.status == s
            )
        )).scalar()
        summary[s] = count

    return summary


@router.get("/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ActivityLog).where(
            ActivityLog.firm_id == current_user.firm_id
        ).order_by(ActivityLog.created_at.desc()).limit(15)
    )
    logs = result.scalars().all()

    items = []
    for log in logs:
        actor_name = "System"
        if log.actor_id:
            p_res = await db.execute(select(Profile).where(Profile.user_id == log.actor_id))
            prof = p_res.scalar_one_or_none()
            if prof:
                actor_name = prof.name

        items.append({
            "id": str(log.id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_name": log.entity_name,
            "actor_name": actor_name,
            "created_at": log.created_at.isoformat(),
        })

    return {"items": items}
