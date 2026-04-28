from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from .notification_service import generate_due_date_notifications, dispatch_notifications as dispatch_pending_notifications

scheduler = AsyncIOScheduler()

def start_scheduler(get_db_dependency):
    """Start the scheduler with a proper DB session factory.
    The `get_db_dependency` should be a callable returning an AsyncSession.
    """
    # 1. Job to generate notifications from upcoming due dates
    async def generation_job():
        async with get_db_dependency() as db:
            await generate_due_date_notifications(db)
            
    # 2. Job to dispatch pending notifications (Email/WhatsApp)
    async def dispatch_job():
        async with get_db_dependency() as db:
            await dispatch_pending_notifications(db)

    # 3. Job to capture daily metrics snapshots
    from .metrics_service import capture_daily_snapshots
    async def metrics_snapshot_job():
        async with get_db_dependency() as db:
            await capture_daily_snapshots(db)

    scheduler.remove_all_jobs()
    
    # Run generation daily at 01:00 UTC
    scheduler.add_job(
        generation_job,
        CronTrigger(hour=1, minute=0),
        name="generate_notifications",
        replace_existing=True,
    )
    
    # Run dispatch every 15 minutes
    scheduler.add_job(
        dispatch_job,
        "interval",
        minutes=15,
        name="dispatch_notifications",
        replace_existing=True,
    )

    # Run metrics snapshot daily at 00:00 UTC
    scheduler.add_job(
        metrics_snapshot_job,
        CronTrigger(hour=0, minute=0),
        name="metrics_snapshot",
        replace_existing=True,
    )
    
    scheduler.start()
