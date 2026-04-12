# CAFlow Phase 2: Implementation Plan

## 1. Project Structure Analysis & Changes
The current CAFlow project follows a clean, modular structure.
- **Backend (FastAPI)**: Uses a standard layering pattern of `models/`, `schemas/`, `api/`, and `core/`. Tenant isolation is achieved using `firm_id` on all major domain models. Both synchronous and asynchronous database operations are supported via SQLAlchemy 2.0.
- **Frontend (Next.js 14 App Router)**: Uses standard `app/(dashboard)/*` routing with separated `lib/api.ts` for API calls, and likely UI components in `components/`.

**Changes for Phase 2**:
To support the Leads, Services, Notices, and Registers modules, we will replicate the existing modular pattern. This means adding:
- 4 new SQLAlchemy models mapped to their respective tables.
- 4 new Pydantic schema files.
- 4 new FastAPI routers (and registering them in `main.py`).
- 4 new Frontend pages under `app/(dashboard)/`.
- API endpoints registered inside `lib/api.ts`.
- Enhancing the current Dashboard endpoints and UI to fetch these new statistics.

Every new model will include `firm_id` as the tenant isolation key to maintain consistency with the existing `Client` and `Task` structures.

---

## 2. Updated Folder Structure
The updated folder structure will look like this (highlighting new additions):

```text
backend/
├── app/
│   ├── models/
│   │   ├── lead.py        (NEW)
│   │   ├── service.py     (NEW)
│   │   ├── notice.py      (NEW)
│   │   └── register.py    (NEW)
│   ├── schemas/
│   │   ├── lead.py        (NEW)
│   │   ├── service.py     (NEW)
│   │   ├── notice.py      (NEW)
│   │   └── register.py    (NEW)
│   └── api/
│       ├── leads.py       (NEW)
│       ├── services.py    (NEW)
│       ├── notices.py     (NEW)
│       └── registers.py   (NEW)
│
frontend/
├── app/
│   └── (dashboard)/
│       ├── leads/
│       │   └── page.tsx   (NEW)
│       ├── services/
│       │   └── page.tsx   (NEW)
│       ├── notices/
│       │   └── page.tsx   (NEW)
│       └── registers/
│           └── page.tsx   (NEW)
```

---

## 3. Backend Implementation Steps

### Step 3.1: Models
Create SQLAlchemy models extending from `Base` and `TimestampMixin` with `firm_id` as the tenant identifier.
- **Lead**: `id`, `firm_id`, `name`, `company_name`, `email`, `phone`, `source`, `status` (Enum), `expected_value`, etc.
- **Service**: `id`, `firm_id`, `name`, `code`, `base_price`, etc.
- **Notice**: `id`, `firm_id`, `client_id`, `notice_type`, `due_date`, `status` (Enum), etc.
- **Register**: `id`, `firm_id`, `client_id`, `register_type`, `status`, etc.

### Step 3.2: Schemas
Define Pydantic schema files mapping to these models (e.g., `LeadCreate`, `LeadUpdate`, `LeadResponse`, `LeadListResponse`) replicating the pattern seen in `schemas/client.py`.

### Step 3.3: API Routers
Create CRUD route handlers ensuring tenant isolation via `current_user.firm_id`:
- `GET /api/leads`
- `POST /api/leads`
- `PUT /api/leads/{id}`
- `DELETE /api/leads/{id}`
*(Repeat for services, notices, and registers)*

### Step 3.4: Main Application & Dashboard Analytics
- Register the 4 new routers in `backend/app/main.py`.
- Update `backend/app/api/dashboard.py` to aggregate counts for Total Leads, Active Services, and Overdue Notices.
- Generate an Alembic migration: `alembic revision --autogenerate -m "Add phase 2 modules"` and upgrade the DB.

---

## 4. Frontend Implementation Steps

### Step 4.1: API Client
Update `frontend/lib/api.ts` to include:
- `leadsApi`
- `servicesApi`
- `noticesApi`
- `registersApi`
And add new endpoints under `dashboardApi` if needed.

### Step 4.2: UI Pages
Create the new Next.js routes using server/client components and React Query hooks if available (or standard `useEffect` depending on codebase patterns):
- **Leads Page**: A data table with filters for status, source, and priority. Include an "Add Lead" modal and a "Convert to Client" button.
- **Services Page**: A data table supporting toggle active/inactive.
- **Notices Page**: A data table displaying a visual badge when `due_date` is overdue.
- **Registers Page**: Standard CRUD interface for compliance registers.

### Step 4.3: Dashboard Adjustments
Modify `frontend/app/(dashboard)/dashboard/page.tsx` to include new metric cards (Total Leads, Overdue Notices) and a section for Upcoming Follow-ups using Recharts for statistics visualization.

---

## 5. Migration Steps
1. Stop backend and frontend servers via Docker/shell.
2. In the `backend` folder, execute: `alembic revision --autogenerate -m "add leads services notices registers"`
3. Execute `alembic upgrade head` to apply schema changes to PostgreSQL.
4. Restart the servers.

---

## 6. Sample API Requests (Postman)

**Create Lead (POST `/api/leads`)**
```json
{
  "name": "Jane Doe",
  "company_name": "Doe Tech",
  "email": "jane@tech.com",
  "phone": "9876543210",
  "source": "website",
  "status": "new",
  "priority": "high"
}
```

**Get Notices (GET `/api/notices?status=overdue`)**
Returns standard paginated response with notice items.

---

## 7. Testing Checklist
- [ ] Tenant Isolation: Check that User A at Firm A cannot see Leads generated by Firm B.
- [ ] Authentication: All new endpoints must require ` Depends(get_current_staff)`.
- [ ] Validation: Test invalid email structures on Lead creation payloads.
- [ ] Business logic: Confirm "Convert to Client" transfers data from Lead correctly and sets status to "won".
- [ ] Frontend: Ensure data tables display loading states dynamically.
- [ ] Frontend: Verify overdue notices show correct visual indicators (e.g., Red Badge).
- [ ] Database: Run Alembic migrations up and down to check db script integrity.
