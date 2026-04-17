# CAFlow Enhancement Plan: Inspired by Tuna Practice

Based on the [Tuna Practice inspiration](https://practice.turia.in/dashboard/sales), we will enhance CAFlow to become a more comprehensive, premium "all-in-one" platform for CA firms.

## 1. Dashboard Revamp (Multi-Tab Insights)
We will transition the current unified dashboard into a tabbed interface, allowing users to drill down into specific operational areas.

### A. Sales Dashboard (New)
Directly inspired by the screenshot, this tab will focus on revenue and invoicing.
- **Metrics**:
    - **Total Sales**: Lifetime value of all invoices issued.
    - **Total Collection**: Total revenue received (Paid invoices).
    - **Total Outstanding**: Amount still owed by clients.
- **Visualizations**:
    - **Revenue Growth**: A weekly bar chart showing daily sales performance (Mon-Sun).
    - **Invoicing Reports**: Monthly comparison of Proforma vs. Regular Invoices.
    - **Revenue Trends**: Line chart showing collection trends over time.

### B. Tasks & Attendance Tab
- **Task Overview**: high-level status of firm-wide tasks.
- **Attendance Summary**: (New) Integration placeholders for staff attendance/check-ins.

---

## 2. New Specialized CA Modules (Inspired by Turia)

### A. Digital Vault & Password Manager (New)
A secure repository for sensitive client data.
- **Portal Credentials**: Store and manage login IDs/passwords for GST, Income Tax, and MCA portals with firm-wide encryption.
- **DSC Register**: Track Digital Signature Certificates (DSCs) for both clients and firm members, with automated expiry alerts.

### B. Specialized Registers (New)
- **Document In/Out Register**: Track the physical movement of client files (Folders, Original Deed, etc.) into and out of the firm.
- **License Tracker**: Centralized dashboard for client business licenses (FSSAI, Trade, Shops & Est.) with renewal notifications.

### C. HRMS & Geo-Attendance
Extending the Attendance placeholder:
- **GPS-Tagged Check-ins**: Mobile-friendly check-in for field staff (visiting client offices).
- **Leave & Reimbursements**: Integrated request and approval workflow for staff expenses and holiday tracking.

### D. Advanced Billing & Tally Export
- **Proforma Invoices**: Generate draft invoices for client approval.
- **Recurring Retainers**: Automatically generate monthly/quarterly bills for recurring services.
- **Tally Export**: Download billing data in Tally-compliant XML/JSON format for easy accounting.

---

## 3. Communication & Automation
- **WhatsApp Marketing**: Broadcast updates or compliance reminders to client groups.
- **Email-to-Task**: Convert client emails directly into actionable tasks or leads.
- **MCA/GST Sync**: Integration placeholders for fetching real-time filing status using CIN/GSTIN.

---

## 4. Aesthetic & UX Upgrades
To match the premium feel of Turia:
- **Color Palette**: Refined Indigo/Iris theme with softer backgrounds.
- **Action Center**: A centralized hub on the dashboard for "Pending Approvals" and "Expiring Soon" (DSCs/Licenses).
- **Glassmorphism**: Enhanced UI depth with refined shadows and blurs.

---

## 5. Revised Implementation Steps

### Phase 1: Sales Insights (COMPLETED)
- Revenue metrics and Weekly Sales charts added.
- Tabbed Dashboard interface implemented.

### Phase 2: Timesheets & Core Modules (COMPLETED)
- Full Timesheet logging and API logic implemented.
- Sidebar updated with vibrant icons.

### Phase 3: Specialized Registers (Immediate)
1.  **Backend**: Add `Vault` and `DocumentRegister` models.
2.  **Frontend**: Implement `DSC Register` and `License Tracker` pages.

### Phase 4: HRMS & Advanced Billing
1.  **Backend**: Add `AttendanceLog` with Geo-coordinates.
2.  **Frontend**: Complete the Attendance module and Tally export feature.

## Questions for User
- Should we prioritize the **Sales Dashboard** or the **Timesheet/Attendance** module first?
- Do you have specific logic for "Proforma Invoices" or should they be treated as a status within the existing Invoice module?
