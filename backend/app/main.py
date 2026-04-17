from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limit import limiter
from app.core.config import settings
from app.db.database import engine
from app.db.base import Base

# Import all models so Alembic and SQLAlchemy can detect them
from app.models import (
    firm, user, profile, client, compliance, task, document,
    invoice, notification, activity_log, lead, service,
    notice, register, notification_rule, vault, timesheet,
    physical_register, attendance, communication, leave
) # noqa

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from app.api import (
    auth, clients, compliance as compliance_router, tasks, 
    documents, invoices, notifications, team, dashboard, 
    leads, services, notices, registers, billing, vault, 
    timesheets, physical_registers, attendance, communication
)

from app.core.audit import register_audit_listeners

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.cache import redis_client
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
    
    # Initialize SQL Alchemy lifecycle hooks
    register_audit_listeners()
    # Database migrations should be handled by Alembic explicitly in CI/CD pipeline
    # Removed Base.metadata.create_all anti-pattern
    yield


app = FastAPI(
    title="CAFlow API",
    description="Multi-tenant SaaS Platform for Chartered Accountants",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(billing.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(vault.router, prefix="/api/vault", tags=["Vault"])
app.include_router(timesheets.router, prefix="/api/timesheets", tags=["Timesheets"])
app.include_router(physical_registers.router, prefix="/api/physical-registers", tags=["Physical Registers"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(communication.router, prefix="/api/communication", tags=["Communication"])


@app.get("/", tags=["Health"])
async def root():
    return {"message": "CAFlow API is running", "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
