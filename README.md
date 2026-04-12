# CAFlow — Practice Management SaaS for Chartered Accountants

A production-ready, multi-tenant SaaS platform for CA firms to manage clients, compliance, tasks, documents, billing, and teams.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis (optional for local dev)

---

### Option A: Docker (Recommended — one command)

```bash
docker compose up --build
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

---

### Option B: Manual Setup

#### 1. Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Setup environment
copy .env.example .env
# Edit .env with your PostgreSQL credentials

# Create PostgreSQL database
# psql -U postgres -c "CREATE DATABASE caflow; CREATE USER caflow WITH PASSWORD 'caflow123'; GRANT ALL ON DATABASE caflow TO caflow;"

# Run migrations (auto-handled on startup) OR manually:
alembic upgrade head

# Seed demo data
python seed.py

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
Swagger docs: **http://localhost:8000/docs**

---

#### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🔑 Demo Credentials

After running `python seed.py`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@caflow.demo | demo1234 |
| Employee | priya@caflow.demo | demo1234 |

---

## 📁 Project Structure

```
New folder/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── core/                # Config, security, dependencies
│   │   ├── db/                  # Database + base models
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── api/                 # Route handlers
│   ├── alembic/                 # DB migrations
│   ├── seed.py                  # Demo data seeder
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/              # Login, Register pages
│   │   └── (dashboard)/         # Protected pages
│   │       ├── dashboard/       # Stats + charts
│   │       ├── clients/         # Client management
│   │       ├── compliance/      # GST/ITR/TDS tracker
│   │       ├── tasks/           # Task management (list + kanban)
│   │       ├── documents/       # File uploads
│   │       ├── billing/         # Invoices
│   │       ├── team/            # Team management
│   │       └── settings/        # Profile + password
│   ├── components/
│   │   └── layout/              # Sidebar, Topbar
│   ├── lib/                     # API client, auth helpers
│   ├── types/                   # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 16 with async SQLAlchemy |
| Auth | JWT (access + refresh tokens) |
| Storage | Local (dev) / AWS S3 (prod) |
| Cache/Queue | Redis |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Docker + Docker Compose |

---

## 🔌 API Endpoints

| Module | Endpoint |
|---|---|
| Auth | POST /api/auth/register, /login, /refresh, GET /api/auth/me |
| Clients | GET/POST /api/clients, GET/PUT/DELETE /api/clients/{id} |
| Compliance | GET/POST /api/compliance, GET/PUT/DELETE /api/compliance/{id} |
| Tasks | GET/POST /api/tasks, GET/PUT/DELETE /api/tasks/{id} |
| Documents | GET /api/documents, POST /api/documents/upload |
| Invoices | GET/POST /api/invoices, GET/PUT/DELETE /api/invoices/{id} |
| Notifications | GET /api/notifications, PUT /api/notifications/{id}/read |
| Team | GET /api/team, POST /api/team/invite, PUT /api/team/{id}/role |
| Dashboard | GET /api/dashboard/stats, /upcoming-deadlines, /compliance-summary |

Full interactive docs at `/docs` (Swagger) or `/redoc`.

---

## 🌱 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key-min-32-chars
DATABASE_URL=postgresql+asyncpg://caflow:caflow123@localhost:5432/caflow
REDIS_URL=redis://localhost:6379/0
AWS_ACCESS_KEY_ID=... (optional, for S3)
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=caflow-documents
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📦 Phase Delivery Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 ✅ | Complete | Auth, Clients, Compliance, Dashboard |
| Phase 2 ✅ | Complete | Tasks (list+kanban), Documents, Team |
| Phase 3 ✅ | Complete | Billing, Invoicing, Analytics |
| Phase 4 🔄 | Scaffold | AI/OCR hooks ready for integration |
| Phase 5 🔄 | In Progress | Testing, Docker, hardening |
