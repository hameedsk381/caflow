# Calendar & Leaves — Design Spec
**Date:** 2026-04-17  
**Status:** Approved

---

## Overview

Two integrated modules: a firm-wide **Calendar** that aggregates all time-bound events (compliance deadlines, tasks, hearings, leaves), and a **Leaves** management system with a submit/approve workflow.

---

## 1. Calendar Module

### View
- **Default:** Monthly grid (react-big-calendar)
- **Switcher:** Month / Week / Agenda (top-right of page)
- **Navigation:** Prev / Next / Today buttons

### Event Sources (aggregated by `/api/calendar/events`)
| Source | Colour | Field used as date |
|---|---|---|
| Compliance deadlines | Indigo `#6366f1` | `due_date` |
| Tasks | Blue `#3b82f6` | `due_date` |
| Notice hearings | Amber `#f59e0b` | `hearing_date` |
| Leave (approved) | Green `#10b981` | `from_date → to_date` |
| Leave (pending) | Red `#f87171` | `from_date → to_date` |

### Access
- Staff see only their own tasks/leaves + all compliance/hearings
- Admins/Managers see firm-wide view (all staff leaves visible)

### Single API endpoint
`GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD`  
Returns a unified list of `{ id, title, start, end, type, colour, meta }` objects — the frontend consumes this directly with react-big-calendar.

---

## 2. Leaves Module

### Leave Types
- Casual Leave
- Sick Leave
- Annual Leave
- Compensatory Leave
- Work From Home (WFH)
- Half Day

### Data Model — `LeaveRequest`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `firm_id` | UUID FK | Multi-tenant isolation |
| `user_id` | UUID FK | Staff who applied |
| `leave_type` | Enum | 6 types above |
| `from_date` | Date | Inclusive |
| `to_date` | Date | Inclusive |
| `reason` | Text | Optional |
| `status` | Enum | `pending`, `approved`, `rejected` |
| `approved_by` | UUID FK → users | Nullable, set on decision |
| `approved_at` | DateTime | Nullable |
| `created_at` | DateTime | Auto |

### API Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/leaves` | Submit leave request |
| `GET` | `/api/leaves/my` | My leave history |
| `GET` | `/api/leaves/pending` | Manager: all pending requests |
| `GET` | `/api/leaves` | Admin: all firm leaves |
| `POST` | `/api/leaves/{id}/approve` | Manager: approve |
| `POST` | `/api/leaves/{id}/reject` | Manager: reject |

### Approval Workflow
1. Staff submits → status `pending` → appears red on calendar
2. Any manager approves/rejects → status updates → calendar updates colour (green/removed)
3. Manager permission check: `current_user.role in ["admin", "manager", "owner"]`

---

## 3. Frontend Pages

### `/calendar`
- Full-page react-big-calendar in month view
- Colour-coded events from unified API
- Click event → popover with title, type, client/staff name, date
- Sidebar panel: "Apply for Leave" form + "Pending Approvals" (visible to managers only)

### Sidebar entry
- Calendar → `/calendar` (new sidebar item)
- Leaves → `/leaves` (standalone page for leave history + apply)

### `/leaves`
- Staff view: my leave history table + apply form
- Manager view: same + "Pending Approvals" tab with approve/reject buttons

---

## 4. Dependencies

- **Frontend:** `react-big-calendar`, `date-fns` (already installed)
- **Backend:** No new packages needed

---

## 5. Out of Scope
- Leave balance tracking / quotas (can be added later)
- Email/WhatsApp notification on leave approval (future)
- Public holidays calendar integration (future)
