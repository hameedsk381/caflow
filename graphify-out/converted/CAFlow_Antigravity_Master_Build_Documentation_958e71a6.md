<!-- converted from CAFlow_Antigravity_Master_Build_Documentation.docx -->

CAFlow
Master Build Documentation for Antigravity
Turia-like Chartered Accountant SaaS Platform
Frontend + Backend + Database + Phase-wise Delivery
Important note: No existing codebase was attached here, so this document instructs the builder to audit the current project first before making changes.

# 1. Purpose of This Document
This document is the complete execution brief for building CAFlow, a SaaS platform for Chartered Accountants similar in product direction to Turia. It is meant to be provided directly to Antigravity so it can generate or update the full project end to end.
# 2. Builder Mandate
- Inspect the existing project first before generating new code.
- Update and extend the current project instead of replacing it blindly.
- Generate both frontend and backend folders if missing, and fill all missing database pieces.
- Create database schema, migrations, seed data, environment files, and setup instructions.
- Keep the product modular, production-oriented, and usable.
- Do not leave placeholder-only pages. Each module must work end to end.
# 3. Product Objective
Build a multi-tenant practice management platform for Chartered Accountants to manage clients, compliance, tasks, documents, billing, reminders, team operations, and analytics from one centralized product.
# 4. Target Users
# 5. Core Functional Modules
- Authentication and User Management
- Client Management
- Compliance Tracker for GST, ITR, and TDS
- Automated Reminder System
- Task and Workflow Management
- Document Management
- Billing and Invoicing
- Dashboard and Analytics
- Team Management
# 6. Advanced Features
- AI-based compliance suggestions
- GST mismatch alerts
- Smart reminders
- OCR-based document parsing
# 7. Required Technology Stack
# 8. High-Level Architecture
Frontend (Next.js) → Backend API (FastAPI) → PostgreSQL → AWS S3 → Redis / Worker Layer → Notifications
The frontend must consume backend APIs cleanly. All business logic, validations, and permission checks should remain in the backend.
# 9. Existing Project Audit and Update Flow
# 10. Frontend Requirements
## Pages
- Landing or sign-in flow
- Dashboard
- Clients list and client details page
- Compliance tracker pages
- Task management pages
- Documents page
- Billing and invoicing pages
- Team management page
- Settings and profile pages
## UI Requirements
- Professional SaaS dashboard layout
- Sidebar navigation
- Top navigation for search, notifications, user menu
- Responsive design for laptop and tablet
- Loading states, empty states, and error states
- Form validation and toast notifications
# 11. Backend Requirements
- FastAPI modular architecture with routers, schemas, services, models, and core utilities
- REST APIs for all modules
- JWT auth with secure password hashing
- Role-based access control
- Firm-based tenant isolation
- Validation and structured error responses
- Background jobs for reminders and scheduled processing
- OpenAPI docs enabled and clean endpoint grouping
# 12. Database Requirements
All business tables must be scoped by tenant using firm_id or tenant_id. Suggested core tables:
# 13. Security Requirements
- JWT authentication
- Password hashing
- Role-based access control
- Multi-tenant data isolation
- Private document access control
- Secure environment variable handling
- Audit logging for critical actions
# 14. Phase-Wise Implementation Plan
# 15. API Expectations
- Auth APIs: signup, login, me, refresh token
- Client APIs: create, list, detail, update, delete
- Compliance APIs: create, list, update status, overdue filters
- Task APIs: create, assign, update, list by user or client
- Document APIs: upload, list, download, delete
- Billing APIs: create invoice, list invoices, update invoice status
- Notification APIs: list, mark as read
- Team APIs: invite, list members, change roles
# 16. UX and Product Quality Expectations
- UI should feel modern, clean, and business-focused
- Do not copy the reference product pixel by pixel; build a similar category-level experience
- Use reusable components and consistent spacing
- Important data should be visible without too many clicks
- Support filters, search, and status chips where useful
# 17. Testing and QA Requirements
- Backend unit tests for core services where practical
- API smoke tests for major flows
- Frontend validation for forms and protected routes
- Check role-based permissions and tenant isolation
- Verify uploads, reminders, and invoice flows
# 18. Final Delivery Requirements
- Complete frontend folder
- Complete backend folder
- Database schema and migration files
- Seed data or demo credentials
- Docker or local setup instructions
- Environment variable templates
- Readable README with run steps
# 19. Final Prompt to Give Antigravity
| Project | CAFlow |
| --- | --- |
| Reference | Turia-like practice management platform |
| Primary instruction | Inspect existing project first, then update and complete it |
| Output required | Full frontend, backend, database, deployment-ready project |
| User Type | Goals | Access |
| --- | --- | --- |
| Firm Admin / CA | Manage firm, team, clients, billing, dashboards | Full tenant-level access |
| Employee | Handle assigned tasks, clients, and compliance work | Role-based restricted access |
| Client | Upload docs, view invoices, receive reminders | Client portal access |
| Tax Consultant | Support filings and operational workflows | Assigned-scope access |
| Layer | Technology | Requirements |
| --- | --- | --- |
| Frontend | Next.js / React | Dashboard UI, forms, routing, charts, responsive layout |
| Backend | FastAPI | REST APIs, services, auth, validations, background jobs |
| Database | PostgreSQL | Relational multi-tenant schema and migrations |
| Storage | AWS S3 | Secure document uploads and downloads |
| Auth | JWT | Access and refresh token flow |
| Queue / Cache | Redis | Notifications, reminders, background processing |
| Workers | Celery or RQ | Scheduled reminders and async tasks |
| Deployment | Docker | Local and production-ready setup |
| Step | Audit Area | Expected Builder Action |
| --- | --- | --- |
| 1 | Project folders | Detect frontend, backend, shared libs, config, and missing modules |
| 2 | Dependencies | Check package versions, missing packages, and compatibility issues |
| 3 | Frontend pages | Identify working pages, broken pages, and incomplete flows |
| 4 | Backend APIs | Review auth, routes, schemas, services, and missing endpoints |
| 5 | Database | Review models, tables, relations, migrations, seeds, constraints |
| 6 | Auth flow | Verify signup, login, protected routes, and role permissions |
| 7 | Storage | Inspect file upload flow and S3 integration gaps |
| 8 | Final action | Refactor, extend, and complete the current codebase |
| Table | Purpose | Important Columns |
| --- | --- | --- |
| firms | Tenant / organization master | id, name, domain, created_at |
| users | Firm users | id, firm_id, email, password_hash, role, status |
| profiles | User metadata | user_id, name, phone, avatar |
| clients | Client master | id, firm_id, name, gstin, pan, contact details |
| compliance | Compliance tracking | id, client_id, type, due_date, status, assigned_to |
| tasks | Operational tasks | id, firm_id, client_id, title, priority, due_date, status |
| documents | Uploaded files | id, firm_id, client_id, file_url, file_name, uploaded_by |
| invoices | Billing records | id, firm_id, client_id, amount, invoice_status, due_date |
| notifications | Reminder and in-app alerts | id, user_id, title, message, read_status |
| activity_logs | Audit history | id, firm_id, actor_id, action, entity_type, entity_id, timestamp |
| Phase | Goal | Deliverables | Exit Criteria |
| --- | --- | --- | --- |
| Phase 1 | Foundation / MVP | Auth, onboarding, clients, compliance tracker, dashboard, base DB schema, protected routes | Users can sign in, add clients, track compliance, and see dashboard data |
| Phase 2 | Core Operations | Tasks, reminders, documents, team management, better filters and UX | Operational workflows are usable end to end |
| Phase 3 | Finance Layer | Billing, invoicing, payment status, analytics enrichment | Firms can create and track invoices |
| Phase 4 | AI Layer | OCR parsing, smart reminders, AI suggestions, GST mismatch-ready hooks | Advanced productivity features work with existing modules |
| Phase 5 | Production Hardening | Testing, bug fixes, RBAC audit, deployment configs, seed data, docs | Project is stable and deployment-ready |
| Build and update a production-ready SaaS web application called CAFlow, inspired by the category and workflow style of Turia.

Critical instruction:
First inspect the existing project codebase and update it intelligently. Do not rebuild blindly from scratch. Preserve working parts, fix broken parts, fill missing modules, and generate whatever is still absent.

The final output must include:
1. Full frontend code
2. Full backend code
3. Complete PostgreSQL database schema
4. Migration files
5. Seed data
6. Environment variable templates
7. Setup instructions
8. Production-ready folder structure

Product requirements:
- Multi-tenant SaaS platform for Chartered Accountants
- One firm can have multiple users
- One firm manages multiple clients
- Features: authentication, clients, compliance tracking, reminders, tasks, documents, billing, dashboard, team management
- Advanced features: AI-based compliance suggestions, GST mismatch alerts, OCR document parsing, smart reminders

Required tech stack:
- Frontend: Next.js / React
- Backend: FastAPI
- Database: PostgreSQL
- Storage: AWS S3
- Auth: JWT
- Queue/cache: Redis
- Background jobs: Celery or RQ
- Deployment-ready with Docker

Database expectations:
Create tables for firms, users, profiles, clients, compliance, tasks, documents, invoices, notifications, activity_logs.
All data must support tenant isolation using firm_id or tenant_id.

Phase-wise delivery:
- Phase 1: Auth, onboarding, clients, compliance tracker, dashboard
- Phase 2: Tasks, reminders, documents, team management
- Phase 3: Billing, invoicing, analytics improvements
- Phase 4: AI features
- Phase 5: Testing, hardening, and deployment readiness

Frontend expectations:
- Professional SaaS dashboard layout
- Sidebar navigation
- Responsive pages
- Forms, tables, filters, search, empty states, and loading states
- Notification dropdown or panel

Backend expectations:
- Modular FastAPI architecture
- REST APIs for every module
- Validation
- Role-based access control
- JWT auth
- Tenant isolation
- Background reminder system

Please generate or update the project end to end so it is actually runnable, not just visually generated. |
| --- |