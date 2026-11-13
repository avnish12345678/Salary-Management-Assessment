# ACME – Enterprise Employee Salary Management System

HR Salary Intelligence Platform for ACME (~10,000 multi-country employees): employee management, auditable salary revisions, currency-safe dashboards and reports, and RBAC.

## Status

**Phase 7 complete:** production deploy configs, migration/seed/health docs, and deployment runbook. Live Vercel/Render URLs require your account login (see [docs/deployment.md](docs/deployment.md)).

## Documentation

| Document | Description |
|----------|-------------|
| [docs/requirements.md](docs/requirements.md) | Product requirements (one-pager) |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/database-design.md](docs/database-design.md) | Schema, constraints, indexes |
| [docs/technical-decisions.md](docs/technical-decisions.md) | Architecture Decision Records |
| [docs/ai-development-log.md](docs/ai-development-log.md) | AI-assisted development log |
| [docs/performance.md](docs/performance.md) | Performance & scalability notes |
| [docs/security-review.md](docs/security-review.md) | Phase 6 security review |
| [docs/deployment.md](docs/deployment.md) | Production deployment runbook |

## Stack

- **Frontend:** React, TypeScript, Vite, MUI, React Router, TanStack Query, RHF, Zod, Recharts, Axios → **Vercel**
- **Backend:** Node.js, Express, TypeScript, Prisma → **Render** (Railway optional)
- **Database:** PostgreSQL (managed)
- **Auth:** JWT + bcrypt + RBAC

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local install or Docker)

## Quick start (local)

```bash
# 1) Install dependencies
npm install

# 2) Start PostgreSQL (Docker example)
docker compose up -d

# 3) Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4) Migrate + seed (exactly 10,000 employees)
npm run db:migrate
npm run db:seed

# 5) Run API and UI
npm run dev:backend
npm run dev:frontend
```

### Default accounts (after seed)

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
| `npm run db:seed` | Deterministic 10,000-employee seed |
| `npm test` | Backend Jest + frontend Vitest |
| `npm run test:e2e` | Playwright flows (requires `E2E_ENABLED=true`) |
| `npm run build` | Production builds |

### Production start (API)

```bash
cd backend
npm run build
npm run start:prod   # prisma migrate deploy && node dist/server.js
```

Health check: `GET /api/health`

## Deployment (summary)

1. Provision managed PostgreSQL.
2. Deploy `backend/` to Render using [`render.yaml`](render.yaml) or the commands in [docs/deployment.md](docs/deployment.md).
3. Set `JWT_SECRET`, `DATABASE_URL`, and `CORS_ORIGIN` in Render secrets.
4. Deploy `frontend/` to Vercel with `VITE_API_BASE_URL` pointing at the API `/api` URL.
5. Run `npm run db:seed` once against production `DATABASE_URL`.
6. Verify login + dashboard + reports.

## Testing notes

```bash
# DB integration tests
$env:RUN_DB_TESTS="true"; npm run test --workspace=backend

# Playwright (API + UI running)
$env:E2E_ENABLED="true"; npm run test:e2e
```

## Phase roadmap

1. Requirements & architecture — done  
2. Scaffold + auth — done  
3. Employee + salary management — done  
4. Dashboard + reports — done  
5. 10,000-employee seed + broader tests — done  
6. Security/performance review — done  
7. Deployment — done (configs + runbook; connect cloud accounts to publish)

## API surface

- Auth: `POST /api/auth/login|logout`, `GET /api/auth/me`
- Employees: `GET/POST /api/employees`, `GET/PATCH /api/employees/:id`, `PATCH /api/employees/:id/status`
- Reference: `GET /api/countries`, `GET /api/departments`
- Salaries: current/history/revisions/compare + `POST .../revisions`, `GET /api/salaries/revisions`
- Dashboard: `GET /api/dashboard/analytics`
- Reports: `GET /api/reports/summary?format=json|csv|xlsx`
- Audit: `GET /api/audit`
- Health: `GET /api/health`
