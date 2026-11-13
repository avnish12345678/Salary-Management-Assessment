# ACME – Employee Salary Management System

## Product Requirements

### 1. Product objective

Build a production-quality **HR Salary Intelligence Platform** for ACME so HR can manage ~10,000 multi-country employees, maintain auditable salary history, and run currency-safe payroll analytics—not a basic CRUD app.

### 2. Target persona

**Primary:** HR Manager — owns workforce data, salary revisions, dashboards, and reports.  
**Secondary:** Super Admin, HR Executive, Viewer (role-scoped access).

### 3. Business problems

- Salary data is fragmented and hard to trust across countries and currencies.
- Changes lack clear revision history and accountability.
- Multi-currency rollups risk incorrect “total payroll” numbers.
- Listing and reporting at 10k employees must stay fast with server-side filters.

### 4. Functional requirements

- JWT authentication, bcrypt passwords, RBAC (`SUPER_ADMIN`, `HR_MANAGER`, `HR_EXECUTIVE`, `VIEWER`).
- Employee management: list, search, filter, sort, paginate, create, edit, detail, activate/deactivate.
- Salary management: view/update components and currency; effective dates; non-overlapping periods; revision history and comparison.
- Dashboard KPIs and charts with currency-aware aggregations (never mix currencies).
- Reports answering payroll, department, range, top earners, and revision questions; CSV/Excel export under same auth/filters.
- Audit logging for sensitive mutations (especially salary).

### 5. Non-functional requirements

- Secure private APIs (headers, rate-limited login, no password/hash leakage).
- Performant at 10k employees (indexes, pagination, efficient aggregations).
- Correct money math via `NUMERIC`/`Decimal`; deterministic seed and tests.
- Documented, deployable (Vercel frontend, Render backend, managed PostgreSQL).

### 6. Application scope

HR-facing web app: auth, employees, salaries/revisions, dashboard, reports/exports, audit logs, departments/countries reference data, health check.

### 7. Deliberately excluded features

Payroll disbursement/banking, statutory tax engines, employee self-service, native mobile apps, SSO/SAML, real-time FX conversion, notification/messaging backends, multi-tenant SaaS.

### 8. Reasoning behind excluded features

Assessment priority is correctness, security, auditability, and multi-currency salary intelligence. Banking, tax, SSO, and FX would expand scope without improving the core evaluation criteria.

### 9. Success criteria

- Docs, schema, and 10,000-employee deterministic seed exist.
- HR Manager can log in; RBAC enforced; employee CRUD/search/pagination work.
- Salary updates preserve history; no overlapping active periods; audit logs recorded.
- Dashboard/reports are accurate and currency-safe; CSV/Excel respect filters/auth.
- Automated tests and production build succeed; deployment docs and working deploy path exist; git history shows incremental commits.
