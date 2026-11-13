# ACME – Enterprise Employee Salary Management System

HR Salary Intelligence Platform for ACME (~10,000 multi-country employees): employee management, auditable salary revisions, currency-safe dashboards and reports, and RBAC.

## Status

**Phase 3 complete:** employee CRUD with server-side filters/pagination, salary revisions with history/compare/audit, and HR UI modules.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/requirements.md](docs/requirements.md) | Product requirements (one-pager) |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/database-design.md](docs/database-design.md) | Schema, constraints, indexes |
| [docs/technical-decisions.md](docs/technical-decisions.md) | Architecture Decision Records |
| [docs/ai-development-log.md](docs/ai-development-log.md) | AI-assisted development log |

## Stack

- **Frontend:** React, TypeScript, Vite, MUI, React Router, TanStack Query, RHF, Zod, Recharts, Axios
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Auth:** JWT + bcrypt + RBAC
- **Deploy (planned):** Vercel (frontend), Render (API), managed PostgreSQL

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local install or Docker)

## Quick start

```bash
# 1) Install dependencies
npm install

# 2) Start PostgreSQL (Docker example)
docker compose up -d

# 3) Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4) Migrate + bootstrap seed (HR Manager account)
npm run db:migrate
npm run db:seed

# 5) Run API and UI
npm run dev:backend
npm run dev:frontend
```

### Default bootstrap accounts (Phase 2 seed)

| Email | Password | Role |
|-------|----------|------|
| `hr.manager@acme.example` | `ChangeMeNow!123` | HR_MANAGER |
| `super.admin@acme.example` | `ChangeMeNow!123` | SUPER_ADMIN |

Change these passwords before any shared/production use.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | API on `:4000` |
| `npm run dev:frontend` | UI on `:5173` |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Idempotent bootstrap seed |
| `npm test` | Backend Jest + frontend Vitest |
| `npm run build` | Production builds |

### Database integration tests

Backend auth integration tests run only when PostgreSQL is available:

```bash
# PowerShell
$env:RUN_DB_TESTS="true"; npm run test --workspace=backend
```

## Phase roadmap

1. Requirements & architecture — done
2. Scaffold + auth — done
3. Employee + salary management — done
4. Dashboard + reports
5. 10,000-employee seed + broader tests
6. Security/performance review
7. Deployment

## Phase 3 API surface

- `GET/POST /api/employees`, `GET/PATCH /api/employees/:id`, `PATCH /api/employees/:id/status`
- `GET /api/countries`, `GET /api/departments`
- `GET /api/salaries/employees/:employeeId/current|history|revisions|compare`
- `POST /api/salaries/employees/:employeeId/revisions`
- `GET /api/salaries/revisions`
