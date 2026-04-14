import asyncio
from app.db.database import engine
from app.db.base import Base
from app.models import firm, user, profile, client, compliance, task, document, invoice, notification, activity_log, lead, service, notice, register, notification_rule, vault, timesheet

async def sync():
    async with engine.begin() as conn:
        print("Dropping legacy schemas...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating fresh unified schemas...")
        await conn.run_sync(Base.metadata.create_all)
        
if __name__ == "__main__":
    asyncio.run(sync())
