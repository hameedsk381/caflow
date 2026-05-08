"""
CAFlow Professional Practice Seed Script
Populates the database with high-fidelity "Chartered Accountant" demo data.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash

# Import all models to ensure they are registered with SQLAlchemy
from app.models.firm import Firm
from app.models.user import User
from app.models.profile import Profile
from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.invoice import Invoice
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.document import Document
from app.models.vault import EncryptedCredential, DSCToken
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.notice import Notice, NoticeStatus, NoticePriority
from app.models.service import Service
from app.models.physical_register import DocumentMovement, License, MovementType
from app.models.notification_rule import NotificationRule
from app.models.timesheet import TimesheetLog
from app.models.attendance import AttendanceLog
from app.models.leave import LeaveRequest
from app.models.communication import CommunicationTemplate, CommunicationLog

import uuid
from datetime import date, timedelta, datetime

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        print("🌱 Initiating Practice Management Seed...")

        # 1. FIRM IDENTITY
        firm = Firm(name="Sharma & Associates", plan="pro", is_active=True)
        db.add(firm)
        await db.flush()
        print(f"✅ Firm Identity Established: {firm.name}")

        # 2. PRACTITIONER PROFILES
        admin_pwd = get_password_hash("demo1234")
        admin = User(
            firm_id=firm.id,
            email="admin@caflow.demo",
            password_hash=admin_pwd,
            role="firm_admin",
            status="active",
        )
        db.add(admin)
        await db.flush()
        db.add(Profile(user_id=admin.id, name="Rajesh Sharma", phone="+91-9876543210"))

        employee = User(
            firm_id=firm.id,
            email="priya@caflow.demo",
            password_hash=admin_pwd,
            role="employee",
            status="active",
        )
        db.add(employee)
        await db.flush()
        db.add(Profile(user_id=employee.id, name="Priya Mehta", phone="+91-9876512345"))
        print("✅ Authorized Practitioners Integrated: Rajesh Sharma, Priya Mehta")

        # 3. ASSESSEE REGISTRY (CLIENTS)
        clients_data = [
            {"name": "Infosys Ltd", "gstin": "29AABCI1681G1ZR", "pan": "AABCI1681G", "email": "accounts@infosys.com", "phone": "+91-8023456789", "business_type": "Public Ltd", "address": "Bengaluru"},
            {"name": "Ratan Textiles", "gstin": "27AAAFR5432L1Z5", "pan": "AAAFR5432L", "email": "ratan@textiles.in", "phone": "+91-9012345678", "business_type": "Proprietorship", "address": "Surat"},
            {"name": "Mehta & Sons LLP", "gstin": "24AABFM7845K1ZA", "pan": "AABFM7845K", "email": "info@mehtasons.com", "phone": "+91-7890123456", "business_type": "LLP", "address": "Ahmedabad"},
            {"name": "Sunrise Hotels Pvt Ltd", "gstin": "06AADCS1234P1ZT", "pan": "AADCS1234P", "email": "finance@sunrise.in", "phone": "+91-9988776655", "business_type": "Private Ltd", "address": "Jaipur"},
        ]
        clients = []
        for c in clients_data:
            client = Client(firm_id=firm.id, **c)
            db.add(client)
            clients.append(client)
        await db.flush()
        print(f"✅ {len(clients)} Assessees Registered")

        # 4. PROFESSIONAL SERVICE CATALOG
        services_data = [
            {"name": "Statutory Audit", "code": "AUD-STAT", "category": "Audit", "base_price": 50000.0, "billing_type": "fixed"},
            {"name": "GST Monthly Filing (GSTR-1/3B)", "code": "GST-FIL", "category": "Compliance", "base_price": 5000.0, "billing_type": "recurring"},
            {"name": "Income Tax Scrutiny Management", "code": "IT-SCRUT", "category": "Advisory", "base_price": 15000.0, "billing_type": "hourly"},
            {"name": "ROC Annual Filing", "code": "ROC-ANNUAL", "category": "Compliance", "base_price": 12000.0, "billing_type": "fixed"},
        ]
        for s in services_data:
            db.add(Service(firm_id=firm.id, **s))
        print("✅ Service Catalog Indexed")

        # 5. STRATEGIC GROWTH PIPELINE (LEADS)
        today_dt = datetime.now()
        leads_data = [
            {"name": "Arjun Khanna", "company_name": "Khanna Logistics", "status": LeadStatus.qualified, "priority": LeadPriority.high, "service_interest": "GST Compliance"},
            {"name": "Sarah Williams", "company_name": "Global Tech Solutions", "status": LeadStatus.new, "priority": LeadPriority.medium, "service_interest": "Foreign Subsidiary Audit"},
            {"name": "Vikram Seth", "company_name": "Seth Organic Farms", "status": LeadStatus.proposal_sent, "priority": LeadPriority.high, "service_interest": "Tax Advisory"},
        ]
        for l in leads_data:
            db.add(Lead(firm_id=firm.id, assigned_to=admin.id, **l))
        print("✅ Growth Pipeline Populated")

        # 6. LEGAL RESPONSE CENTER (NOTICES)
        notices_data = [
            {"client_id": clients[0].id, "notice_type": "Scrutiny Notice u/s 143(3)", "reference_no": "DIN-2024-ITR", "status": NoticeStatus.open, "due_date": today_dt + timedelta(days=7)},
            {"client_id": clients[1].id, "notice_type": "GST Deficiency Memo", "reference_no": "GST-REF-99X", "status": NoticeStatus.in_progress, "due_date": today_dt + timedelta(days=3)},
            {"client_id": clients[2].id, "notice_type": "MCA Notice for AOC-4 Delay", "reference_no": "ROC-MNT-44", "status": NoticeStatus.responded, "due_date": today_dt - timedelta(days=2)},
        ]
        for n in notices_data:
            db.add(Notice(firm_id=firm.id, assigned_to=admin.id, **n))
        print("✅ Legal Registry Populated")

        # 7. IDENTITY VAULT & DSCs
        creds_data = [
            {"client_id": clients[0].id, "portal_name": "GST Portal", "username": "infy_accts", "encrypted_password": "FAKE_ENCRYPTED_TEXT"},
            {"client_id": clients[1].id, "portal_name": "Income Tax Portal", "username": "ratan_tex", "encrypted_password": "FAKE_ENCRYPTED_TEXT"},
        ]
        for cr in creds_data:
            db.add(EncryptedCredential(firm_id=firm.id, **cr))

        dsc_data = [
            {"client_id": clients[0].id, "holder_name": "S. Gopal (Director)", "expiry_date": date.today() + timedelta(days=120), "physical_location": "Drawer A-1"},
            {"client_id": clients[2].id, "holder_name": "Nitin Mehta", "expiry_date": date.today() + timedelta(days=15), "physical_location": "Safe Box 02"},
        ]
        for dsc in dsc_data:
            db.add(DSCToken(firm_id=firm.id, **dsc))
        print("✅ Identity Vault & DSC Inventory Secured")

        # 8. STATUTORY LICENSES & REGISTERS
        licenses_data = [
            {"client_id": clients[0].id, "license_type": "Import-Export Code", "license_number": "IEC1002003", "expiry_date": date.today() + timedelta(days=365)},
            {"client_id": clients[3].id, "license_type": "FSSAI License", "license_number": "2201990001", "expiry_date": date.today() + timedelta(days=20)},
        ]
        for lic in licenses_data:
            db.add(License(firm_id=firm.id, **lic))

        movements_data = [
            {"client_id": clients[2].id, "document_name": "Original LLP Agreement", "movement_type": MovementType.receipt, "date": date.today() - timedelta(days=5), "person_name": "Rohan Mehta", "physical_location": "Cabinet 04"},
        ]
        for mov in movements_data:
            db.add(DocumentMovement(firm_id=firm.id, staff_id=employee.id, **mov))
        print("✅ Statutory Registers & Logistics Initialized")

        # 9. ENGAGEMENT CONSOLE (TASKS & COMPLIANCE)
        comp_data = [
            {"client_id": clients[0].id, "type": "GST", "period": "April 2025", "due_date": date.today() + timedelta(days=5), "status": "pending"},
            {"client_id": clients[1].id, "type": "ITR", "period": "FY 2024-25", "due_date": date.today() + timedelta(days=90), "status": "in_progress"},
        ]
        for c in comp_data:
            db.add(Compliance(firm_id=firm.id, assigned_to=admin.id, **c))

        await db.commit()
        print("\n🎉 Practice Excellence: Seed Completed Successfully!")
        print("\n📋 Management Credentials:")
        print("   Admin: admin@caflow.demo / demo1234")
        print("   Practitioner: priya@caflow.demo / demo1234")

if __name__ == "__main__":
    asyncio.run(seed())
