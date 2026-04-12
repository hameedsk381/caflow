from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import engine
from app.db.base import Base

# Import all models so Alembic and SQLAlchemy can detect them
from app.models import firm, user, client, compliance, task, document, invoice, notification, activity_log, lead, service, notice, register  # noqa

from app.api import auth, clients, compliance as compliance_router, tasks, documents, invoices, notifications, team, dashboard, leads, services, notices, registers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (development mode)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="CAFlow API",
    description="Multi-tenant SaaS Platform for Chartered Accountants",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(compliance_router.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(team.router, prefix="/api/team", tags=["Team"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(notices.router, prefix="/api/notices", tags=["Notices"])
app.include_router(registers.router, prefix="/api/registers", tags=["Registers"])


@app.get("/", tags=["Health"])
async def root():
    return {"message": "CAFlow API is running", "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
