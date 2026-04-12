"""
CAFlow Seed Script - Creates demo data for development
Run: python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.firm import Firm
from app.models.user import User
from app.models.profile import Profile
from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.invoice import Invoice
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
import uuid
from datetime import date, timedelta, datetime


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        print("🌱 Starting seed...")

        # Create Firm
        firm = Firm(name="Sharma & Associates", plan="pro", is_active=True)
        db.add(firm)
        await db.flush()
        print(f"✅ Firm created: {firm.name}")

        # Create Admin User
        admin = User(
            firm_id=firm.id,
            email="admin@caflow.demo",
            password_hash=get_password_hash("demo1234"),
            role="firm_admin",
            status="active",
        )
        db.add(admin)
        await db.flush()

        admin_profile = Profile(user_id=admin.id, name="Rajesh Sharma", phone="+91-9876543210")
        db.add(admin_profile)

        # Create Employee
        employee = User(
            firm_id=firm.id,
            email="priya@caflow.demo",
            password_hash=get_password_hash("demo1234"),
            role="employee",
            status="active",
        )
        db.add(employee)
        await db.flush()
        db.add(Profile(user_id=employee.id, name="Priya Mehta", phone="+91-9876512345"))
        print("✅ Users created: admin@caflow.demo, priya@caflow.demo (password: demo1234)")

        # Create Clients
        clients_data = [
            {"name": "Infosys Ltd", "gstin": "29AABCI1681G1ZR", "pan": "AABCI1681G", "email": "accounts@infosys.com", "phone": "+91-8023456789", "business_type": "Public Ltd", "address": "Electronics City, Bengaluru"},
            {"name": "Ratan Textiles", "gstin": "27AAAFR5432L1Z5", "pan": "AAAFR5432L", "email": "ratan@textiles.in", "phone": "+91-9012345678", "business_type": "Proprietorship", "address": "Surat, Gujarat"},
            {"name": "Mehta & Sons", "gstin": "24AABFM7845K1ZA", "pan": "AABFM7845K", "email": "info@mehtasons.com", "phone": "+91-7890123456", "business_type": "Partnership", "address": "Ahmedabad, Gujarat"},
            {"name": "Sunrise Hotels Pvt Ltd", "gstin": "06AADCS1234P1ZT", "pan": "AADCS1234P", "email": "accounts@sunrisehotels.in", "phone": "+91-9988776655", "business_type": "Private Ltd", "address": "Gurugram, Haryana"},
            {"name": "Kumar Agriculture", "gstin": "08AACKK9876M1ZB", "pan": "AACKK9876M", "email": "kumar@agri.co.in", "phone": "+91-8877665544", "business_type": "Proprietorship", "address": "Jaipur, Rajasthan"},
            {"name": "TechVision Startups", "gstin": "07AABBT6543D1ZC", "pan": "AABBT6543D", "email": "finance@techvision.io", "phone": "+91-9123456789", "business_type": "LLP", "address": "Delhi NCR"},
        ]

        clients = []
        for c in clients_data:
            client = Client(firm_id=firm.id, **c)
            db.add(client)
            clients.append(client)
        await db.flush()
        print(f"✅ {len(clients)} clients created")

        # Create Compliance Records
        today = date.today()
        compliance_data = [
            {"client_id": clients[0].id, "type": "GST", "period": "March 2025", "due_date": today + timedelta(days=5), "status": "pending"},
            {"client_id": clients[1].id, "type": "GST", "period": "March 2025", "due_date": today + timedelta(days=5), "status": "in_progress"},
            {"client_id": clients[2].id, "type": "ITR", "period": "FY 2024-25", "due_date": today + timedelta(days=45), "status": "pending"},
            {"client_id": clients[3].id, "type": "TDS", "period": "Q4 2024-25", "due_date": today - timedelta(days=2), "status": "overdue"},
            {"client_id": clients[4].id, "type": "GST", "period": "March 2025", "due_date": today + timedelta(days=5), "status": "filed", "filing_reference": "ARN0123456789"},
            {"client_id": clients[5].id, "type": "ROC", "period": "FY 2024-25", "due_date": today + timedelta(days=60), "status": "pending"},
            {"client_id": clients[0].id, "type": "TDS", "period": "Q4 2024-25", "due_date": today + timedelta(days=12), "status": "in_progress"},
            {"client_id": clients[1].id, "type": "ITR", "period": "FY 2024-25", "due_date": today + timedelta(days=90), "status": "pending"},
        ]

        for c in compliance_data:
            compliance = Compliance(firm_id=firm.id, assigned_to=admin.id, **c)
            db.add(compliance)
        await db.flush()
        print(f"✅ {len(compliance_data)} compliance records created")

        # Create Tasks
        tasks_data = [
            {"title": "Prepare GST return for Infosys", "client_id": clients[0].id, "priority": "urgent", "status": "in_progress", "due_date": today + timedelta(days=3)},
            {"title": "Review TDS certificates for Sunrise Hotels", "client_id": clients[3].id, "priority": "high", "status": "pending", "due_date": today + timedelta(days=7)},
            {"title": "Annual audit documentation - Mehta & Sons", "client_id": clients[2].id, "priority": "medium", "status": "pending", "due_date": today + timedelta(days=14)},
            {"title": "File ROC annual return for TechVision", "client_id": clients[5].id, "priority": "high", "status": "pending", "due_date": today + timedelta(days=20)},
            {"title": "ITR filing review - Ratan Textiles", "client_id": clients[1].id, "priority": "medium", "status": "pending", "due_date": today + timedelta(days=30)},
            {"title": "Client billing for Q1 invoices", "priority": "low", "status": "pending", "due_date": today + timedelta(days=5)},
            {"title": "Update firm engagement letters", "priority": "low", "status": "completed"},
        ]

        for t in tasks_data:
            task = Task(firm_id=firm.id, created_by=admin.id, assigned_to=employee.id if t.get("priority") != "low" else admin.id, **t)
            db.add(task)
        print(f"✅ {len(tasks_data)} tasks created")

        # Create Invoices
        invoices_data = [
            {"client_id": clients[0].id, "invoice_number": "INV-2025-001", "description": "GST filing services - Q4 2024-25", "amount": 15000, "tax_amount": 2700, "status": "paid", "due_date": today - timedelta(days=10)},
            {"client_id": clients[1].id, "invoice_number": "INV-2025-002", "description": "ITR & GST compliance retainer", "amount": 8000, "tax_amount": 1440, "status": "sent", "due_date": today + timedelta(days=15)},
            {"client_id": clients[2].id, "invoice_number": "INV-2025-003", "description": "Annual audit support services", "amount": 25000, "tax_amount": 4500, "status": "draft"},
            {"client_id": clients[3].id, "invoice_number": "INV-2025-004", "description": "TDS compliance and filing", "amount": 12000, "tax_amount": 2160, "status": "overdue", "due_date": today - timedelta(days=5)},
            {"client_id": clients[4].id, "invoice_number": "INV-2025-005", "description": "GST registration and filing", "amount": 5000, "tax_amount": 900, "status": "paid", "due_date": today - timedelta(days=20)},
        ]

        for inv in invoices_data:
            amt = inv.pop("amount")
            tax = inv.pop("tax_amount")
            invoice = Invoice(
                firm_id=firm.id,
                amount=amt,
                tax_amount=tax,
                total_amount=amt + tax,
                **inv
            )
            db.add(invoice)
        print(f"✅ {len(invoices_data)} invoices created")

        # Create Notifications
        notifs = [
            {"title": "GST Due Alert", "message": "GST return for Infosys is due in 5 days", "type": "reminder", "entity_type": "compliance"},
            {"title": "TDS Overdue", "message": "TDS filing for Sunrise Hotels is overdue!", "type": "warning", "entity_type": "compliance"},
            {"title": "Task Assigned", "message": "New task: Prepare GST return for Infosys", "type": "info", "entity_type": "task"},
            {"title": "Invoice Paid", "message": "Invoice INV-2025-001 has been marked as paid", "type": "info", "entity_type": "invoice"},
            {"title": "Welcome to CAFlow!", "message": "Your practice management platform is ready", "type": "info"},
        ]

        for n in notifs:
            notif = Notification(user_id=admin.id, firm_id=firm.id, **n)
            db.add(notif)

        # Activity Logs
        activities = [
            {"action": "created", "entity_type": "client", "entity_name": "Infosys Ltd"},
            {"action": "filed", "entity_type": "compliance", "entity_name": "GST March 2025 - Kumar Agriculture"},
            {"action": "created", "entity_type": "invoice", "entity_name": "INV-2025-001"},
            {"action": "updated", "entity_type": "task", "entity_name": "Annual audit documentation"},
        ]

        for a in activities:
            log = ActivityLog(firm_id=firm.id, actor_id=admin.id, **a)
            db.add(log)

        await db.commit()
        print("\n🎉 Seed completed successfully!")
        print("\n📋 Demo Credentials:")
        print("   Admin: admin@caflow.demo / demo1234")
        print("   Employee: priya@caflow.demo / demo1234")
        print("\n🚀 Run: uvicorn app.main:app --reload")


if __name__ == "__main__":
    asyncio.run(seed())
