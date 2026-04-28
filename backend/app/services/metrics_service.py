from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from app.models.metrics_snapshot import MetricsSnapshot
from app.models.firm import Firm
from app.models.client import Client
from app.models.compliance import Compliance, ComplianceStatus
from app.models.invoice import Invoice
import logging

logger = logging.getLogger(__name__)

async def capture_daily_snapshots(db: AsyncSession):
    """
    Calculates and saves KPI snapshots for all firms.
    This should run once daily.
    """
    logger.info("Starting daily KPI snapshot capture...")
    
    # 1. Get all firms
    firms_res = await db.execute(select(Firm))
    firms = firms_res.scalars().all()
    
    today = datetime.utcnow().date()
    
    for firm in firms:
        try:
            # 2. Calculate KPIs for this firm
            # Total Clients
            clients_count = (await db.execute(
                select(func.count(Client.id)).where(Client.firm_id == firm.id)
            )).scalar() or 0
            
            # Total Revenue (sum of all paid invoices)
            revenue = (await db.execute(
                select(func.sum(Invoice.total_amount)).where(
                    Invoice.firm_id == firm.id,
                    Invoice.status == 'paid'
                )
            )).scalar() or 0.0
            
            # Outstanding (sum of unpaid invoices)
            outstanding = (await db.execute(
                select(func.sum(Invoice.total_amount)).where(
                    Invoice.firm_id == firm.id,
                    Invoice.status != 'paid'
                )
            )).scalar() or 0.0
            
            # Filing Rate
            total_comp = (await db.execute(
                select(func.count(Compliance.id)).where(Compliance.firm_id == firm.id)
            )).scalar() or 1
            filed_comp = (await db.execute(
                select(func.count(Compliance.id)).where(
                    Compliance.firm_id == firm.id,
                    Compliance.status == ComplianceStatus.filed
                )
            )).scalar() or 0
            filing_rate = (filed_comp / total_comp) * 100
            
            # 3. Save snapshot
            snapshot = MetricsSnapshot(
                firm_id=firm.id,
                snapshot_date=today,
                total_revenue=float(revenue),
                outstanding_amount=float(outstanding),
                total_clients=clients_count,
                filing_rate=float(filing_rate),
                details={
                    "total_compliance": total_comp,
                    "filed_compliance": filed_comp
                }
            )
            db.add(snapshot)
            logger.info(f"Captured snapshot for firm: {firm.name}")
            
        except Exception as e:
            logger.error(f"Failed to capture snapshot for firm {firm.id}: {str(e)}")
            
    await db.commit()
    logger.info("Daily KPI snapshot capture completed.")
