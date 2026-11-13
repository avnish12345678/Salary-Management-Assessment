# ACME – Enterprise Employee Salary Management System

HR Salary Intelligence Platform for ACME (~10,000 multi-country employees): employee management, auditable salary revisions, currency-safe dashboards and reports, and RBAC.

## Status

**Phase 1 complete:** product requirements and architecture documentation. Application scaffolding starts in Phase 2.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/requirements.md](docs/requirements.md) | Product requirements (one-pager) |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/database-design.md](docs/database-design.md) | Schema, constraints, indexes |
| [docs/technical-decisions.md](docs/technical-decisions.md) | Architecture Decision Records |
| [docs/ai-development-log.md](docs/ai-development-log.md) | AI-assisted development log |

## Planned stack

- **Frontend:** React, TypeScript, Vite, MUI, React Router, TanStack Query, RHF, Zod, Recharts, Axios  
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL  
- **Auth:** JWT + bcrypt + RBAC  
- **Deploy:** Vercel (frontend), Render (API), managed PostgreSQL  

## Setup

Local setup, seed (`npm run db:seed`), and deployment instructions will be added with Phase 2–7 deliverables. See requirements and architecture docs for the intended design.
