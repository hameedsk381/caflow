from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date, datetime, timedelta

from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.invoice import Invoice
from app.models.activity_log import ActivityLog
from app.models.lead import Lead
from app.models.service import Service
from app.models.notice import Notice
from app.models.register import Register
from app.models.vault import DSCToken
from app.models.physical_register import License


async def get_dashboard_stats(db: AsyncSession, firm_id: str) -> Dict:
    """Compute real‑time dashboard statistics for a firm.
    Mirrors the logic previously in ``api/dashboard.py`` but is isolated in a service
    so it can be reused, cached, or run in background jobs.
    """
    total_clients = (await db.execute(
        select(func.count(Client.id)).where(Client.firm_id == firm_id, Client.status == "active")
    )).scalar()

    pending_compliance = (await db.execute(
        select(func.count(Compliance.id)).where(
            Compliance.firm_id == firm_id,
            Compliance.status.in_(["pending", "in_progress"]),
        )
    )).scalar()

    overdue_compliance = (await db.execute(
        select(func.count(Compliance.id)).where(
            Compliance.firm_id == firm_id,
            Compliance.due_date < date.today(),
            Compliance.status != "filed",
        )
    )).scalar()

    open_tasks = (await db.execute(
        select(func.count(Task.id)).where(
            Task.firm_id == firm_id,
            Task.status.in_(["pending", "in_progress"]),
        )
    )).scalar()

    # Revenue stats
    total_rev_res = await db.execute(
        select(func.sum(Invoice.total_amount)).where(
            Invoice.firm_id == firm_id,
            Invoice.status == "paid",
        )
    )
    total_revenue = float(total_rev_res.scalar() or 0)

    total_sales_res = await db.execute(
        select(func.sum(Invoice.total_amount)).where(
            Invoice.firm_id == firm_id,
            Invoice.status != "cancelled",
        )
    )
    total_sales = float(total_sales_res.scalar() or 0)

    total_collection = total_revenue
    total_outstanding = max(0, total_sales - total_collection)

    pending_invoices = (await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.firm_id == firm_id,
            Invoice.status.in_(["sent", "overdue"]),
        )
    )).scalar()

    total_leads = (await db.execute(
        select(func.count(Lead.id)).where(Lead.firm_id == firm_id)
    )).scalar()

    active_services = (await db.execute(
        select(func.count(Service.id)).where(Service.firm_id == firm_id, Service.is_active == True)
    )).scalar()

    overdue_notices = (await db.execute(
        select(func.count(Notice.id)).where(
            Notice.firm_id == firm_id,
            Notice.due_date < func.now(),
            Notice.status != "closed",
        )
    )).scalar()

    open_notices = (await db.execute(
        select(func.count(Notice.id)).where(
            Notice.firm_id == firm_id,
            Notice.status.in_(["open", "in_progress"]),
        )
    )).scalar()

    total_registers = (await db.execute(
        select(func.count(Register.id)).where(Register.firm_id == firm_id)
    )).scalar()

    expiring_dsc = (await db.execute(
        select(func.count(DSCToken.id)).where(
            DSCToken.firm_id == firm_id,
            DSCToken.expiry_date <= (date.today() + timedelta(days=90)),
            DSCToken.expiry_date >= date.today(),
        )
    )).scalar()

    expiring_licenses = (await db.execute(
        select(func.count(License.id)).where(
            License.firm_id == firm_id,
            License.expiry_date <= (date.today() + timedelta(days=30)),
            License.expiry_date >= date.today(),
        )
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
        "open_notices": open_notices,
        "total_registers": total_registers,
        "total_sales": total_sales,
        "total_collection": total_collection,
        "total_outstanding": total_outstanding,
        "expiring_dsc": expiring_dsc,
        "expiring_licenses": expiring_licenses,
    }
