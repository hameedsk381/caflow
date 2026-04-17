import asyncio
from app.db.database import engine
from app.db.base import Base
# Import all model modules to ensure they are registered with Base.metadata
from app.models import (
    firm, user, profile, client, compliance, task, document, 
    invoice, notification, activity_log, lead, service, notice, 
    register, notification_rule, vault, timesheet, attendance, 
    leave, communication, physical_register
)

async def sync():
    async with engine.begin() as conn:
        print("🛠️ Initiating Database Reset...")
        print("🗑️ Dropping existing practice management schemas...")
        await conn.run_sync(Base.metadata.drop_all)
        print("🏗️ Creating fresh professional unified schemas...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Database Synchronization Complete.")
        
if __name__ == "__main__":
    asyncio.run(sync())
