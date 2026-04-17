# Calendar & Leaves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a firm-wide Calendar page (monthly grid aggregating compliance, tasks, hearings, and leaves) and a Leaves module with submit/approve workflow.

**Architecture:** A single `/api/calendar/events?from=&to=` endpoint aggregates events from four existing models (Compliance, Task, Notice, LeaveRequest) and returns a unified list consumed by `react-big-calendar` on the frontend. Leaves use a new `LeaveRequest` model with `pending → approved/rejected` status, approvable by any `firm_admin`.

**Tech Stack:** FastAPI (backend), SQLAlchemy async, React + react-big-calendar, shadcn/ui, date-fns (already installed), TypeScript

---

## File Map

### Backend — New
- `backend/app/models/leave.py` — LeaveRequest SQLAlchemy model
- `backend/app/schemas/leave.py` — Pydantic request/response schemas
- `backend/app/api/leaves.py` — CRUD + approve/reject endpoints
- `backend/app/api/calendar.py` — Unified calendar events endpoint

### Backend — Modified
- `backend/app/main.py` — register `leaves` and `calendar` routers
- `backend/app/models/user.py` — add `leave_requests` relationship
- `backend/app/models/__init__.py` — import `leave` module

### Frontend — New
- `frontend/app/(dashboard)/calendar/page.tsx` — calendar page with react-big-calendar
- `frontend/app/(dashboard)/leaves/page.tsx` — leaves list + apply + approve panel

### Frontend — Modified
- `frontend/lib/api.ts` — add `leavesApi`, `calendarApi`
- `frontend/components/layout/Sidebar.tsx` — add Calendar and Leaves nav items
- `frontend/types/index.ts` — add `CalendarEvent`, `LeaveRequest` types

---

## Task 1: LeaveRequest Model

**Files:**
- Create: `backend/app/models/leave.py`
- Modify: `backend/app/models/user.py`

- [ ] **Step 1: Create the model**

```python
# backend/app/models/leave.py
import uuid
import enum
from sqlalchemy import Column, String, ForeignKey, Date, DateTime, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class LeaveType(str, enum.Enum):
    casual = "casual"
    sick = "sick"
    annual = "annual"
    compensatory = "compensatory"
    wfh = "wfh"
    half_day = "half_day"


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    leave_type = Column(SAEnum(LeaveType), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(SAEnum(LeaveStatus), default=LeaveStatus.pending, nullable=False)

    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="leave_requests", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
```

- [ ] **Step 2: Add relationship to User model**

In `backend/app/models/user.py`, add to the `User` class after the `attendance_logs` relationship:

```python
    leave_requests = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.user_id", cascade="all, delete-orphan")
```

- [ ] **Step 3: Register model in main.py imports**

In `backend/app/main.py`, add `leave` to the existing model import tuple:

```python
from app.models import (
    firm, user, profile, client, compliance, task, document,
    invoice, notification, activity_log, lead, service,
    notice, register, notification_rule, vault, timesheet,
    physical_register, attendance, communication, leave
) # noqa
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/leave.py backend/app/models/user.py backend/app/main.py
git commit -m "feat: add LeaveRequest model"
```

---

## Task 2: Leave Schemas

**Files:**
- Create: `backend/app/schemas/leave.py`

- [ ] **Step 1: Write the schemas**

```python
# backend/app/schemas/leave.py
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import date, datetime
from app.models.leave import LeaveType, LeaveStatus


class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType
    from_date: date
    to_date: date
    reason: Optional[str] = None


class LeaveRequestResponse(BaseModel):
    id: uuid.UUID
    firm_id: uuid.UUID
    user_id: uuid.UUID
    leave_type: LeaveType
    from_date: date
    to_date: date
    reason: Optional[str] = None
    status: LeaveStatus
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    applicant_name: Optional[str] = None

    class Config:
        from_attributes = True
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/leave.py
git commit -m "feat: add leave schemas"
```

---

## Task 3: Leaves API

**Files:**
- Create: `backend/app/api/leaves.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write the API**

```python
# backend/app/api/leaves.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List
from datetime import datetime
import uuid

from app.db.database import get_db
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.user import User, UserRole
from app.schemas.leave import LeaveRequestCreate, LeaveRequestResponse
from app.core.dependencies import get_current_staff

router = APIRouter()


def _to_response(req: LeaveRequest) -> dict:
    name = None
    if req.user and req.user.profile:
        name = req.user.profile.full_name
    return {**req.__dict__, "applicant_name": name}


@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    data: LeaveRequestCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    if data.to_date < data.from_date:
        raise HTTPException(status_code=400, detail="to_date must be >= from_date")
    leave = LeaveRequest(
        firm_id=current_user.firm_id,
        user_id=current_user.id,
        **data.model_dump(),
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.id == leave.id)
    )
    return _to_response(res.scalar_one())


@router.get("/my", response_model=List[LeaveRequestResponse])
async def my_leaves(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.user_id == current_user.id, LeaveRequest.firm_id == current_user.firm_id)
        .order_by(LeaveRequest.from_date.desc())
    )
    return [_to_response(r) for r in result.scalars().all()]


@router.get("/pending", response_model=List[LeaveRequestResponse])
async def pending_leaves(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.firm_admin:
        raise HTTPException(status_code=403, detail="Only admins can view pending approvals")
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.firm_id == current_user.firm_id, LeaveRequest.status == LeaveStatus.pending)
        .order_by(LeaveRequest.created_at.asc())
    )
    return [_to_response(r) for r in result.scalars().all()]


@router.get("", response_model=List[LeaveRequestResponse])
async def all_leaves(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.firm_admin:
        raise HTTPException(status_code=403, detail="Only admins can view all leaves")
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.firm_id == current_user.firm_id)
        .order_by(LeaveRequest.from_date.desc())
    )
    return [_to_response(r) for r in result.scalars().all()]


@router.post("/{leave_id}/approve", response_model=LeaveRequestResponse)
async def approve_leave(
    leave_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.firm_admin:
        raise HTTPException(status_code=403, detail="Only admins can approve leaves")
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.id == leave_id, LeaveRequest.firm_id == current_user.firm_id)
    )
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = LeaveStatus.approved
    leave.approved_by = current_user.id
    leave.approved_at = datetime.now()
    await db.commit()
    await db.refresh(leave)
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.id == leave.id)
    )
    return _to_response(res.scalar_one())


@router.post("/{leave_id}/reject", response_model=LeaveRequestResponse)
async def reject_leave(
    leave_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.firm_admin:
        raise HTTPException(status_code=403, detail="Only admins can reject leaves")
    result = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.id == leave_id, LeaveRequest.firm_id == current_user.firm_id)
    )
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = LeaveStatus.rejected
    leave.approved_by = current_user.id
    leave.approved_at = datetime.now()
    await db.commit()
    await db.refresh(leave)
    res = await db.execute(
        select(LeaveRequest)
        .options(joinedload(LeaveRequest.user).joinedload(User.profile))
        .where(LeaveRequest.id == leave.id)
    )
    return _to_response(res.scalar_one())
```

- [ ] **Step 2: Register router in main.py**

Add to imports in `backend/app/main.py`:
```python
from app.api import (
    auth, clients, compliance as compliance_router, tasks,
    documents, invoices, notifications, team, dashboard,
    leads, services, notices, registers, billing, vault,
    timesheets, physical_registers, attendance, communication,
    leaves
)
```

Add after the communication router registration:
```python
app.include_router(leaves.router, prefix="/api/leaves", tags=["Leaves"])
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/leaves.py backend/app/main.py
git commit -m "feat: add leaves API endpoints"
```

---

## Task 4: Calendar Unified Events API

**Files:**
- Create: `backend/app/api/calendar.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write the calendar events endpoint**

```python
# backend/app/api/calendar.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from datetime import date, datetime, timedelta
from typing import List

from app.db.database import get_db
from app.models.compliance import Compliance
from app.models.task import Task
from app.models.notice import Notice
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.client import Client
from app.models.user import User, UserRole
from app.core.dependencies import get_current_staff

router = APIRouter()


def _date_to_iso(d) -> str:
    if isinstance(d, datetime):
        return d.date().isoformat()
    return d.isoformat() if d else None


@router.get("/events")
async def get_calendar_events(
    from_date: date = Query(default=None),
    to_date: date = Query(default=None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    firm_id = current_user.firm_id
    is_admin = current_user.role == UserRole.firm_admin

    # Default: current month
    today = date.today()
    start = from_date or today.replace(day=1)
    if to_date:
        end = to_date
    else:
        if today.month == 12:
            end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(today.year, today.month + 1, 1) - timedelta(days=1)

    events = []

    # 1. Compliance deadlines (all staff see these)
    comp_result = await db.execute(
        select(Compliance).options(joinedload(Compliance.client)).where(
            Compliance.firm_id == firm_id,
            Compliance.due_date >= start,
            Compliance.due_date <= end,
            Compliance.status != "filed",
        )
    )
    for c in comp_result.scalars().all():
        events.append({
            "id": f"compliance-{c.id}",
            "title": f"{c.type} — {c.client.name if c.client else 'Unknown'}",
            "start": _date_to_iso(c.due_date),
            "end": _date_to_iso(c.due_date),
            "type": "compliance",
            "colour": "#6366f1",
        })

    # 2. Tasks (staff see assigned tasks; admin sees all)
    task_query = select(Task).where(
        Task.firm_id == firm_id,
        Task.due_date >= start,
        Task.due_date <= end,
        Task.status.notin_(["completed", "cancelled"]),
    )
    if not is_admin:
        task_query = task_query.where(Task.assigned_to == current_user.id)
    task_result = await db.execute(task_query)
    for t in task_result.scalars().all():
        events.append({
            "id": f"task-{t.id}",
            "title": t.title,
            "start": _date_to_iso(t.due_date),
            "end": _date_to_iso(t.due_date),
            "type": "task",
            "colour": "#3b82f6",
        })

    # 3. Notice hearings (all staff see these)
    notice_result = await db.execute(
        select(Notice).options(joinedload(Notice.client)).where(
            Notice.firm_id == firm_id,
            Notice.due_date != None,
            Notice.due_date >= datetime.combine(start, datetime.min.time()),
            Notice.due_date <= datetime.combine(end, datetime.max.time()),
            Notice.status.notin_(["closed"]),
        )
    )
    for n in notice_result.scalars().all():
        events.append({
            "id": f"notice-{n.id}",
            "title": f"Hearing: {n.notice_type} — {n.client.name if n.client else 'Unknown'}",
            "start": _date_to_iso(n.due_date),
            "end": _date_to_iso(n.due_date),
            "type": "hearing",
            "colour": "#f59e0b",
        })

    # 4. Leave requests
    leave_query = select(LeaveRequest).options(
        joinedload(LeaveRequest.user).joinedload(User.profile)
    ).where(
        LeaveRequest.firm_id == firm_id,
        LeaveRequest.status.in_([LeaveStatus.approved, LeaveStatus.pending]),
        LeaveRequest.from_date <= end,
        LeaveRequest.to_date >= start,
    )
    if not is_admin:
        leave_query = leave_query.where(LeaveRequest.user_id == current_user.id)
    leave_result = await db.execute(leave_query)
    for lv in leave_result.scalars().all():
        name = lv.user.profile.full_name if lv.user and lv.user.profile else "Staff"
        colour = "#10b981" if lv.status == LeaveStatus.approved else "#f87171"
        events.append({
            "id": f"leave-{lv.id}",
            "title": f"{name} — {lv.leave_type.replace('_', ' ').title()}",
            "start": lv.from_date.isoformat(),
            "end": lv.to_date.isoformat(),
            "type": "leave",
            "colour": colour,
        })

    return {"events": events}
```

- [ ] **Step 2: Register router in main.py**

Add to imports:
```python
from app.api import (
    auth, clients, compliance as compliance_router, tasks,
    documents, invoices, notifications, team, dashboard,
    leads, services, notices, registers, billing, vault,
    timesheets, physical_registers, attendance, communication,
    leaves, calendar as calendar_router
)
```

Add registration:
```python
app.include_router(calendar_router.router, prefix="/api/calendar", tags=["Calendar"])
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/calendar.py backend/app/main.py
git commit -m "feat: add unified calendar events API"
```

---

## Task 5: Frontend Types & API Methods

**Files:**
- Modify: `frontend/types/index.ts`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Add types to index.ts**

Append to `frontend/types/index.ts`:

```typescript
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: 'compliance' | 'task' | 'hearing' | 'leave'
  colour: string
}

export interface LeaveRequest {
  id: string
  firm_id: string
  user_id: string
  leave_type: 'casual' | 'sick' | 'annual' | 'compensatory' | 'wfh' | 'half_day'
  from_date: string
  to_date: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  created_at: string
  applicant_name?: string
}
```

- [ ] **Step 2: Add API methods to lib/api.ts**

Append before the last export or at the end of `frontend/lib/api.ts`:

```typescript
// Calendar
export const calendarApi = {
  events: (from?: string, to?: string) =>
    api.get('/api/calendar/events', { params: { from_date: from, to_date: to } }),
}

// Leaves
export const leavesApi = {
  apply: (data: any) => api.post('/api/leaves', data),
  myLeaves: () => api.get('/api/leaves/my'),
  pending: () => api.get('/api/leaves/pending'),
  all: () => api.get('/api/leaves'),
  approve: (id: string) => api.post(`/api/leaves/${id}/approve`),
  reject: (id: string) => api.post(`/api/leaves/${id}/reject`),
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/types/index.ts frontend/lib/api.ts
git commit -m "feat: add calendar and leaves API client methods"
```

---

## Task 6: Install react-big-calendar

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install the package**

```bash
cd frontend && npm install react-big-calendar
```

- [ ] **Step 2: Verify installation**

```bash
ls node_modules/react-big-calendar/lib/css/
# Expected: react-big-calendar.css
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install react-big-calendar"
```

---

## Task 7: Leaves Page

**Files:**
- Create: `frontend/app/(dashboard)/leaves/page.tsx`

- [ ] **Step 1: Create the leaves page**

```tsx
// frontend/app/(dashboard)/leaves/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { leavesApi } from '@/lib/api'
import type { LeaveRequest } from '@/types'
import { format } from 'date-fns'
import { Plus, CheckCircle2, XCircle, Clock, Palmtree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'compensatory', label: 'Compensatory Leave' },
  { value: 'wfh', label: 'Work From Home' },
  { value: 'half_day', label: 'Half Day' },
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>
  if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
}

export default function LeavesPage() {
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([])
  const [pending, setPending] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>('my')
  const [form, setForm] = useState({
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: '',
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const myRes = await leavesApi.myLeaves()
      setMyLeaves(myRes.data)
      try {
        const pendingRes = await leavesApi.pending()
        setPending(pendingRes.data)
        setIsAdmin(true)
      } catch {
        setIsAdmin(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!form.from_date || !form.to_date) return toast.error('Please select dates')
    try {
      await leavesApi.apply(form)
      toast.success('Leave request submitted!')
      setIsApplyOpen(false)
      setForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' })
      fetchData()
    } catch {
      toast.error('Failed to submit leave request')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await leavesApi.approve(id)
      toast.success('Leave approved')
      fetchData()
    } catch {
      toast.error('Failed to approve')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await leavesApi.reject(id)
      toast.success('Leave rejected')
      fetchData()
    } catch {
      toast.error('Failed to reject')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaves</h1>
          <p className="text-muted-foreground">Apply for leave and track your requests.</p>
        </div>
        <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit a leave request for manager approval.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Leave Type</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>From</Label>
                  <Input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>To</Label>
                  <Input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Reason (Optional)</Label>
                <Textarea placeholder="Brief reason for leave..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
              <Button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-700">Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-500" />
          <div><p className="text-xs text-muted-foreground uppercase">Pending</p>
            <p className="text-2xl font-bold">{myLeaves.filter(l => l.status === 'pending').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div><p className="text-xs text-muted-foreground uppercase">Approved</p>
            <p className="text-2xl font-bold">{myLeaves.filter(l => l.status === 'approved').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-rose-500" />
          <div><p className="text-xs text-muted-foreground uppercase">Rejected</p>
            <p className="text-2xl font-bold">{myLeaves.filter(l => l.status === 'rejected').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Palmtree className="h-5 w-5 text-indigo-500" />
          <div><p className="text-xs text-muted-foreground uppercase">Total</p>
            <p className="text-2xl font-bold">{myLeaves.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex gap-1 border-b">
          {(['my', 'approvals'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab === 'approvals' ? `Pending Approvals (${pending.length})` : 'My Leaves'}
            </button>
          ))}
        </div>
      )}

      {/* My Leaves Table */}
      {activeTab === 'my' && (
        <Card>
          <CardHeader><CardTitle>My Leave History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 animate-pulse">Loading...</TableCell></TableRow>
                ) : myLeaves.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No leave requests yet.</TableCell></TableRow>
                ) : myLeaves.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium capitalize">{l.leave_type.replace('_', ' ')}</TableCell>
                    <TableCell>{format(new Date(l.from_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(l.to_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-muted-foreground italic text-sm">{l.reason || '—'}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approvals Table (admin only) */}
      {activeTab === 'approvals' && isAdmin && (
        <Card>
          <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No pending approvals.</TableCell></TableRow>
                ) : pending.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold">{l.applicant_name || 'Staff'}</TableCell>
                    <TableCell className="capitalize">{l.leave_type.replace('_', ' ')}</TableCell>
                    <TableCell>{format(new Date(l.from_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(l.to_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-muted-foreground italic text-sm">{l.reason || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => handleApprove(l.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleReject(l.id)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/(dashboard)/leaves/page.tsx
git commit -m "feat: add leaves page with apply and approval UI"
```

---

## Task 8: Calendar Page

**Files:**
- Create: `frontend/app/(dashboard)/calendar/page.tsx`

- [ ] **Step 1: Create the calendar page**

```tsx
// frontend/app/(dashboard)/calendar/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { enIN } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { calendarApi } from '@/lib/api'
import type { CalendarEvent } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-IN': enIN },
})

const LEGEND = [
  { label: 'Compliance', colour: '#6366f1' },
  { label: 'Tasks', colour: '#3b82f6' },
  { label: 'Hearings', colour: '#f59e0b' },
  { label: 'Leave (Approved)', colour: '#10b981' },
  { label: 'Leave (Pending)', colour: '#f87171' },
]

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>('month')

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const from = format(startOfMonth(date), 'yyyy-MM-dd')
      const to = format(endOfMonth(date), 'yyyy-MM-dd')
      const res = await calendarApi.events(from, to)
      const mapped = (res.data.events as CalendarEvent[]).map(e => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start + 'T00:00:00'),
        end: new Date(e.end + 'T23:59:59'),
        colour: e.colour,
        type: e.type,
      }))
      setEvents(mapped)
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents(currentDate) }, [currentDate, fetchEvents])

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: event.colour,
      borderRadius: '4px',
      border: 'none',
      color: '#fff',
      fontSize: '11px',
      fontWeight: 600,
      padding: '1px 4px',
    },
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Firm-wide view of deadlines, tasks, hearings and leaves.</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span style={{ background: l.colour }} className="w-3 h-3 rounded-sm inline-block" />
            {l.label}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}
          <div style={{ height: 650 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(v) => setView(v)}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              eventPropGetter={eventStyleGetter}
              style={{ fontFamily: 'inherit' }}
              views={['month', 'week', 'agenda']}
              popup
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/(dashboard)/calendar/page.tsx
git commit -m "feat: add calendar page with react-big-calendar"
```

---

## Task 9: Sidebar + CSS Import

**Files:**
- Modify: `frontend/components/layout/Sidebar.tsx`
- Modify: `frontend/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Add Calendar and Leaves to sidebar navItems**

In `frontend/components/layout/Sidebar.tsx`, add to the `navItems` array after the Dashboard entry:

```typescript
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, color: 'text-violet-500' },
  { href: '/leaves', label: 'Leaves', icon: Palmtree, color: 'text-green-500' },
```

And add the new icons to the import line:

```typescript
import {
  LayoutDashboard, Users, ShieldCheck, CheckSquare,
  FolderOpen, Receipt, UserCog, Settings, LogOut, Zap,
  Clock, Calendar, Sparkles, Files, ClipboardList, MessageSquare,
  CalendarDays, Palmtree
} from 'lucide-react'
```

- [ ] **Step 2: Import react-big-calendar CSS globally**

In `frontend/app/(dashboard)/layout.tsx`, add at the top:

```typescript
import 'react-big-calendar/lib/css/react-big-calendar.css'
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/layout/Sidebar.tsx frontend/app/(dashboard)/layout.tsx
git commit -m "feat: add Calendar and Leaves to sidebar"
```

---

## Task 10: Database Migration

**Files:**
- Run Alembic to generate and apply migration

- [ ] **Step 1: Generate migration**

```bash
cd backend
alembic revision --autogenerate -m "add_leave_requests_table"
```

Expected: a new file in `alembic/versions/` with `op.create_table('leave_requests', ...)`

- [ ] **Step 2: Apply migration**

```bash
alembic upgrade head
```

Expected output: `Running upgrade ... -> ..., add_leave_requests_table`

- [ ] **Step 3: Verify table exists**

```bash
psql postgresql://caflow:caflow123@localhost:5432/caflow -c "\dt leave_requests"
```

Expected: `leave_requests` listed

- [ ] **Step 4: Commit**

```bash
git add alembic/versions/
git commit -m "feat: migration for leave_requests table"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Monthly calendar grid → Task 8 (react-big-calendar, month default)
- ✅ Week / Agenda switcher → Task 8 (`views={['month','week','agenda']}`)
- ✅ All event types (compliance, tasks, hearings, leaves) → Task 4
- ✅ Colour coding → Task 4 (colours defined) + Task 8 (eventStyleGetter)
- ✅ 6 leave types → Task 1 (LeaveType enum), Task 7 (LEAVE_TYPES array)
- ✅ Submit leave → Task 7 (apply dialog)
- ✅ Manager approval → Task 3 (approve/reject endpoints), Task 7 (approvals tab)
- ✅ firm_admin check for approval → Task 3 (`current_user.role != UserRole.firm_admin`)
- ✅ Sidebar entries → Task 9
- ✅ DB migration → Task 10

**Type consistency:**
- `leavesApi.approve(id)` defined in Task 5, called in Task 7 ✅
- `calendarApi.events(from, to)` defined in Task 5, called in Task 8 ✅
- `LeaveRequest` type defined in Task 5, used in Task 7 ✅
- `CalendarEvent` type defined in Task 5, used in Task 8 ✅
- `LeaveType` enum values: `casual/sick/annual/compensatory/wfh/half_day` — match between Task 1 (model) and Task 7 (LEAVE_TYPES array) ✅
