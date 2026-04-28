from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from fastapi_cache.decorator import cache
from app.db.database import get_db
from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.invoice import Invoice
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.core.dependencies import get_current_staff
from datetime import date, datetime, timedelta
from app.models.lead import Lead
from app.models.service import Service
from app.models.notice import Notice
from app.models.register import Register
from app.models.vault import DSCToken
from app.models.physical_register import License
from app.models.metrics_snapshot import MetricsSnapshot

router = APIRouter()

def firm_key_builder(func, namespace: str = "", *, request: Request = None, response: Response = None, **kwargs):
    current_user = kwargs.get("current_user")
    firm_id = str(current_user.firm_id) if current_user else "global"
    return f"{namespace}:{func.__name__}:{firm_id}"

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id
    
    # Counts
    total_clients = (await db.execute(select(func.count(Client.id)).where(Client.firm_id == firm_id))).scalar() or 0
    pending_compliance = (await db.execute(select(func.count(Compliance.id)).where(
        Compliance.firm_id == firm_id, 
        Compliance.status != "filed"
    ))).scalar() or 0
    overdue_compliance = (await db.execute(select(func.count(Compliance.id)).where(
        Compliance.firm_id == firm_id, 
        Compliance.status == "overdue"
    ))).scalar() or 0
    open_tasks = (await db.execute(select(func.count(Task.id)).where(
        Task.firm_id == firm_id, 
        Task.status != "completed"
    ))).scalar() or 0
    
    # Revenue (Total Paid)
    total_revenue = (await db.execute(select(func.sum(Invoice.total_amount)).where(
        Invoice.firm_id == firm_id, 
        Invoice.status == "paid"
    ))).scalar() or 0
    
    # Outstanding
    total_outstanding = (await db.execute(select(func.sum(Invoice.total_amount)).where(
        Invoice.firm_id == firm_id, 
        Invoice.status.in_(["sent", "overdue"])
    ))).scalar() or 0
    
    # Registers & Vault
    total_dsc = (await db.execute(select(func.count(DSCToken.id)).where(DSCToken.firm_id == firm_id))).scalar() or 0
    expiring_dsc = (await db.execute(select(func.count(DSCToken.id)).where(
        DSCToken.firm_id == firm_id,
        DSCToken.expiry_date <= date.today() + timedelta(days=30),
        DSCToken.expiry_date >= date.today()
    ))).scalar() or 0
    
    # Notices
    open_notices = (await db.execute(select(func.count(Notice.id)).where(
        Notice.firm_id == firm_id,
        Notice.status != "closed"
    ))).scalar() or 0

    return {
        "total_clients": total_clients,
        "pending_compliance": pending_compliance,
        "overdue_compliance": overdue_compliance,
        "open_tasks": open_tasks,
        "total_revenue": float(total_revenue),
        "total_outstanding": float(total_outstanding),
        "total_registers": total_dsc, # Simplification
        "expiring_dsc": expiring_dsc,
        "open_notices": open_notices,
    }

@router.get("/sales-data")
async def get_sales_data(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id
    today = date.today()
    
    # Weekly Revenue (last 7 days)
    weekly_data = []
    for i in range(7):
        d = today - timedelta(days=6-i)
        next_d = d + timedelta(days=1)
        res = await db.execute(
            select(func.sum(Invoice.total_amount)).where(
                Invoice.firm_id == firm_id,
                Invoice.status == "paid",
                Invoice.created_at >= datetime.combine(d, datetime.min.time()),
                Invoice.created_at < datetime.combine(next_d, datetime.min.time())
            )
        )
        amount = float(res.scalar() or 0)
        weekly_data.append({
            "day": d.strftime("%a"),
            "amount": amount
        })

    # Monthly collection vs outstanding (last 6 months)
    monthly_data = []
    for i in range(5, -1, -1):
        # First day of each month
        first_day = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        if first_day.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1)

        collected = await db.execute(
            select(func.sum(Invoice.total_amount)).where(
                Invoice.firm_id == firm_id,
                Invoice.status == "paid",
                Invoice.created_at >= datetime.combine(first_day, datetime.min.time()),
                Invoice.created_at < datetime.combine(last_day, datetime.min.time())
            )
        )
        outstanding = await db.execute(
            select(func.sum(Invoice.total_amount)).where(
                Invoice.firm_id == firm_id,
                Invoice.status.in_(["sent", "overdue"]),
                Invoice.created_at >= datetime.combine(first_day, datetime.min.time()),
                Invoice.created_at < datetime.combine(last_day, datetime.min.time())
            )
        )
        monthly_data.append({
            "month": first_day.strftime("%b %Y"),
            "collected": float(collected.scalar() or 0),
            "outstanding": float(outstanding.scalar() or 0),
        })

    return {
        "weekly_sales": weekly_data,
        "monthly_trends": monthly_data,
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
    total = 0
    for s in statuses:
        count = (await db.execute(
            select(func.count(Compliance.id)).where(
                Compliance.firm_id == firm_id,
                Compliance.status == s
            )
        )).scalar() or 0
        summary[s] = count
        total += count
    
    summary["total"] = total
    return summary


@router.get("/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ActivityLog)
        .options(joinedload(ActivityLog.actor).joinedload(User.profile))
        .where(ActivityLog.firm_id == current_user.firm_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(15)
    )
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
        })

    return {"items": items}

@router.get("/filing-trends")
async def get_filing_trends(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id
    today = date.today()
    
    trends = []
    for i in range(5, -1, -1):
        first_day = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        if first_day.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1)
            
        filed_count = (await db.execute(
            select(func.count(Compliance.id)).where(
                Compliance.firm_id == firm_id,
                Compliance.status == "filed",
                Compliance.updated_at >= datetime.combine(first_day, datetime.min.time()),
                Compliance.updated_at < datetime.combine(last_day, datetime.min.time())
            )
        )).scalar() or 0
        
        target_count = (await db.execute(
            select(func.count(Compliance.id)).where(
                Compliance.firm_id == firm_id,
                Compliance.due_date >= first_day,
                Compliance.due_date < last_day
            )
        )).scalar() or 0
        
        trends.append({
            "name": first_day.strftime("%b"),
            "filed": filed_count,
            "target": target_count
        })
        
    return trends

@router.get("/growth-metrics")
async def get_growth_metrics(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id
    
    # Get last 30 snapshots for trends
    res = await db.execute(
        select(MetricsSnapshot)
        .where(MetricsSnapshot.firm_id == firm_id)
        .order_by(MetricsSnapshot.snapshot_date.asc())
        .limit(30)
    )
    snapshots = res.scalars().all()
    
    return [
        {
            "date": s.snapshot_date.isoformat(),
            "revenue": s.total_revenue,
            "clients": s.total_clients,
            "filing_rate": s.filing_rate,
        }
        for s in snapshots
    ]
