"""
CAFlow Massive Professional Practice Seed Script
Populates the database with dozens of high-fidelity "Chartered Accountant" demo records per module.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
import random
import uuid
from datetime import date, timedelta, datetime

# Models
from app.models.firm import Firm
from app.models.user import User
from app.models.profile import Profile
from app.models.client import Client
from app.models.compliance import Compliance
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.invoice import Invoice, InvoiceStatus
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
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType
from app.models.communication import CommunicationTemplate, CommunicationLog

# Utils
SURNAME = ["Sharma", "Mehta", "Khanna", "Singhania", "Goenka", "Agarwal", "Verma", "Gupta", "Malhotra", "Kapoor", "Joshi", "Patel", "Reddy", "Iyer", "Nair"]
BUZ_TYPES = ["Pvt Ltd", "LLP", "Proprietorship", "Partnership", "Public Ltd", "HUF", "Trust", "Society"]
INDUSTRIES = ["Textiles", "Logistics", "Tech Solutions", "Energy", "Hospitality", "Pharma", "Real Estate", "Automobiles", "Fintech", "Metals"]

def gen_gst(state="27"):
    chars = "ABCDE"
    mid = "".join(random.choices(chars, k=5))
    num = "".join(random.choices("0123456789", k=4))
    end = random.choice(chars)
    return f"{state}{mid}{num}{end}1Z5"

def gen_pan():
    chars = "ABCDE"
    mid = "".join(random.choices(chars, k=5))
    num = "".join(random.choices("0123456789", k=4))
    end = random.choice(chars)
    return f"{mid}{num}{end}"

async def seed_massive():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        print("🧬 Initiating Massive Socio-Economic Practice Simulation...")

        # 1. ESTABLISH FIRM
        firm = Firm(name="Sharma, Mehta & Co. Chartered Accountants", plan="enterprise", is_active=True)
        db.add(firm)
        await db.flush()
        
        # 2. PRACTITIONER FORCE
        pwd = get_password_hash("demo1234")
        partners = []
        employees = []
        
        # Admin Partner
        p1 = User(firm_id=firm.id, email="admin@caflow.demo", password_hash=pwd, role="firm_admin", status="active")
        db.add(p1)
        await db.flush()
        db.add(Profile(user_id=p1.id, name="CA Rajesh Sharma", phone="+91-9999900001"))
        partners.append(p1)

        # Additional Partner
        p2 = User(firm_id=firm.id, email="mehta@caflow.demo", password_hash=pwd, role="firm_admin", status="active")
        db.add(p2)
        await db.flush()
        db.add(Profile(user_id=p2.id, name="CA Priya Mehta", phone="+91-9999900002"))
        partners.append(p2)

        # Employees (Practitioners)
        names = ["Amit Shah", "Suresh Raina", "Anita Desai", "Rahul Dravid", "MS Dhoni", "Virat Kohli", "Jasprit Bumrah"]
        for i, name in enumerate(names):
            user = User(firm_id=firm.id, email=f"{name.lower().replace(' ', '.')}@caflow.demo", password_hash=pwd, role="employee", status="active")
            db.add(user)
            await db.flush()
            db.add(Profile(user_id=user.id, name=name, phone=f"+91-980000000{i}"))
            employees.append(user)

        # 3. ASSESSEE UNIVERSE (30 Clients)
        clients = []
        for i in range(30):
            fam = random.choice(SURNAME)
            ind = random.choice(INDUSTRIES)
            bt = random.choice(BUZ_TYPES)
            name = f"{fam} {ind} {bt}"
            client = Client(
                firm_id=firm.id,
                name=name,
                gstin=gen_gst(),
                pan=gen_pan(),
                email=f"compliance@{name.lower().replace(' ', '')}.com",
                phone=f"+91-70000000{i:02d}",
                business_type=bt,
                address=f"Phase {random.randint(1,5)}, Industrial Area, Metropolis"
            )
            db.add(client)
            clients.append(client)
        await db.flush()
        print(f"✅ Universe Density: {len(clients)} Assessees Simulated")

        # 4. SERVICES CATALOG (Core Offerings)
        services = [
            Service(firm_id=firm.id, name="Statutory Audit", code="AUD-STAT", category="Audit", base_price=75000, billing_type="fixed"),
            Service(firm_id=firm.id, name="Tax Audit (44AB)", code="AUD-TAX", category="Audit", base_price=50000, billing_type="fixed"),
            Service(firm_id=firm.id, name="GST Annual Return (9/9C)", code="GST-ANN", category="Compliance", base_price=25000, billing_type="fixed"),
            Service(firm_id=firm.id, name="GST Monthly Advisory", code="GST-ADV", category="Retainer", base_price=10000, billing_type="recurring"),
            Service(firm_id=firm.id, name="ROC Compliance Management", code="ROC-COM", category="Corporate", base_price=15000, billing_type="recurring"),
            Service(firm_id=firm.id, name="Income Tax Scrutiny Rep", code="IT-REP", category="Litigation", base_price=20000, billing_type="hourly"),
            Service(firm_id=firm.id, name="Project Report (CMA)", code="PRJ-CMA", category="Financing", base_price=35000, billing_type="fixed"),
        ]
        for s in services: db.add(s)

        # 5. GROWTH PIPELINE (25 Leads)
        lead_names = ["Arjun", "Karan", "Simran", "Kabir", "Meera", "Ayesha", "Rohan", "Siddharth", "Ishaan", "Zoya"]
        for i in range(25):
            lead = Lead(
                firm_id=firm.id,
                name=f"{random.choice(lead_names)} {random.choice(SURNAME)}",
                company_name=f"{random.choice(SURNAME)} {random.choice(INDUSTRIES)} {random.choice(['Group', 'Ventures', 'Enterprises'])}",
                status=random.choice(list(LeadStatus)),
                priority=random.choice(list(LeadPriority)),
                service_interest=random.choice(["Investment Audit", "GST Implementation", "Tax Planning", "Internal Audit"]),
                assigned_to=random.choice(partners).id
            )
            db.add(lead)
        print("✅ Pipeline Saturation: 25 High-Value Prospects Integrated")

        # 6. LEGAL REGISTRY (40 Notices)
        notice_types = ["Sec 143(3) Scrutiny", "Sec 148 Reassessment", "GST ASMT-10", "GST DRC-01", "MCA Adjudication", "PF/ESI Default", "TDS Deficiency"]
        for i in range(40):
            cl = random.choice(clients)
            notice = Notice(
                firm_id=firm.id,
                client_id=cl.id,
                notice_type=random.choice(notice_types),
                reference_no=f"{random.choice(['IT', 'GST', 'ROC'])}-{random.randint(1000,9999)}/{random.randint(23,25)}",
                status=random.choice(list(NoticeStatus)),
                priority=random.choice(list(NoticePriority)),
                due_date=datetime.now() + timedelta(days=random.randint(-5, 20)),
                assigned_to=random.choice(employees + partners).id
            )
            db.add(notice)
        print("✅ Legal Saturation: 40 Regulatory Interventions Logged")

        # 7. ENGAGEMENT CONSOLE (60 Tasks)
        for i in range(60):
            cl = random.choice(clients)
            task = Task(
                firm_id=firm.id,
                client_id=cl.id,
                title=random.choice(["Verify Input Tax Credit", "Filing AOC-4", "Prepare P&L Schedules", "Review TDS Deductions", "GSTR-3B Reconciliation", "Income Tax Computation"]),
                description="Professional engagement under regulatory standards.",
                status=random.choice(list(TaskStatus)),
                priority=random.choice(list(TaskPriority)),
                due_date=datetime.now() + timedelta(days=random.randint(-2, 10)),
                assigned_to=random.choice(employees).id
            )
            db.add(task)
        print("✅ Production Saturation: 60 Professional Mandates Initialized")

        # 8. IDENTITY VAULT (50 Credentials/DSCs)
        portals = ["Income Tax", "GST", "MCA V3", "EPFO", "ESIC", "TRACES", "DGFT", "Tally Cloud"]
        for cl in clients:
            # Add 1-2 Creds per client
            for _ in range(random.randint(1, 2)):
                db.add(EncryptedCredential(
                    firm_id=firm.id,
                    client_id=cl.id,
                    portal_name=random.choice(portals),
                    username=f"{cl.name.split()[0].lower()}_{random.randint(10,99)}",
                    encrypted_password="ENCRYPTED_VAULT_DECRYPT_REQUIRED"
                ))
            # Add DSC for few clients
            if random.random() > 0.4:
                db.add(DSCToken(
                    firm_id=firm.id,
                    client_id=cl.id,
                    holder_name=f"{cl.name.split()[0]} Managing Director",
                    expiry_date=date.today() + timedelta(days=random.randint(30, 700)),
                    physical_location=random.choice(["Audit Safe 01", "Partner Desk B", "Client Possession", "Courier Queue"])
                ))
        print("✅ Identity Vault Saturation: 50+ Credentials & DSCs Secured")

        # 9. STATUTORY REGISTERS (35 Entries)
        reg_types = ["MOA/AOA Bundle", "Share Certificates", "Board Meeting Minutes", "Title Deeds", "Fixed Asset Register"]
        lic_types = ["Trade License", "FSSAI", "Shop & Est", "Pollution Certificate", "Drug License"]
        for i in range(35):
            cl = random.choice(clients)
            if random.random() > 0.5:
                db.add(License(
                    firm_id=firm.id,
                    client_id=cl.id,
                    license_type=random.choice(lic_types),
                    license_number=f"LIC-{random.randint(100000,999999)}",
                    expiry_date=date.today() + timedelta(days=random.randint(10, 500))
                ))
            else:
                db.add(DocumentMovement(
                    firm_id=firm.id,
                    client_id=cl.id,
                    document_name=random.choice(reg_types),
                    movement_type=random.choice(list(MovementType)),
                    date=date.today() - timedelta(days=random.randint(1, 100)),
                    person_name=f"{random.choice(lead_names)} {random.choice(SURNAME)}",
                    staff_id=random.choice(employees).id,
                    physical_location=f"Locker {random.randint(1,10)}"
                ))
        print("✅ Statutory Logistics Initialized: 35 Secure Movements")

        # 10. COMPLIANCE CALENDAR (40 Items)
        for i in range(40):
            cl = random.choice(clients)
            db.add(Compliance(
                firm_id=firm.id,
                client_id=cl.id,
                type=random.choice(["GST", "ITR", "TDS", "ROC", "PT", "OTHER"]),
                period=random.choice(["March 2025", "FY 2024-25", "Q4 24-25"]),
                due_date=date.today() + timedelta(days=random.randint(-2, 45)),
                status=random.choice(["pending", "in_progress", "filed"]),
                assigned_to=random.choice(employees).id
            ) )
        
        # 11. COMMUNICATION LOGS (80 Logs)
        for i in range(80):
            cl = random.choice(clients)
            db.add(CommunicationLog(
                firm_id=firm.id,
                client_id=cl.id,
                channel=random.choice(["whatsapp", "email"]),
                sent_to=cl.email if random.random() > 0.5 else cl.phone,
                content="Dear Valued Assessee, this is an automated professional liaison Regarding your mandate...",
                status="sent"
            ))

        await db.commit()
        print("\n🏆 SOCIO-ECONOMIC SIMULATION COMPLETE!")
        print(f"📊 Summary for {firm.name}:")
        print(f"   - Assessees: 30 | Practitioners: 9")
        print(f"   - Mandates: 60 | Legal Notices: 40 | Pipeline: 25")
        print(f"   - Vault Keys: 50+ | Statutory Logs: 35 | Correspondence: 80")
        print("\n📋 FIRM MASTER KEY:")
        print("   Primary Admin: admin@caflow.demo / demo1234")

if __name__ == "__main__":
    asyncio.run(seed_massive())
