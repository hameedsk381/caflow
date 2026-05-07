import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.models.firm import Firm
from app.models.profile import Profile
from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.invoice import Invoice
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.document import Document
from app.models.vault import EncryptedCredential, DSCToken
from app.models.lead import Lead
from app.models.notice import Notice
from app.models.service import Service
from app.models.physical_register import DocumentMovement, License
from app.models.notification_rule import NotificationRule
from app.models.timesheet import TimesheetLog
from app.models.attendance import AttendanceLog
from app.models.leave import LeaveRequest
from app.models.communication import CommunicationTemplate, CommunicationLog
from app.core.security import get_password_hash

async def add_priya():
    async with AsyncSessionLocal() as db:
        # Get Firm
        res = await db.execute(select(Firm).limit(1))
        firm = res.scalar_one_or_none()
        if not firm:
            print("No firm found. Run seed first.")
            return

        # Check if Priya exists
        res = await db.execute(select(User).where(User.email == "priya@caflow.demo"))
        user = res.scalar_one_or_none()
        
        pwd = get_password_hash("demo1234")
        
        if not user:
            print("Creating priya@caflow.demo...")
            user = User(
                firm_id=firm.id,
                email="priya@caflow.demo",
                password_hash=pwd,
                role="employee",
                status="active"
            )
            db.add(user)
            await db.flush()
            db.add(Profile(user_id=user.id, name="CA Priya Mehta", phone="+91-9999900002"))
            await db.commit()
            print("Priya account created.")
        else:
            print("Priya account already exists. Updating password and role...")
            user.password_hash = pwd
            user.role = "employee"
            await db.commit()
            print("Priya password and role updated.")

if __name__ == "__main__":
    asyncio.run(add_priya())
