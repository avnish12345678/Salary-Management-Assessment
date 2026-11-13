# Deployment Guide

ACME deploys as three components:

| Component | Target | Notes |
|-----------|--------|-------|
| Frontend | **Vercel** | Vite SPA; set `VITE_API_BASE_URL` at **build** time |
| Backend API | **Render** (or Railway) | Node 20; runs migrations on boot |
| Database | **Managed PostgreSQL** | Render Postgres / Neon / Railway / Supabase |

Never commit real credentials. Use platform secret stores and `.env` files that stay local.

## Prerequisites

- Node.js 20+
- Accounts for Vercel + Render (or Railway)
- A public Git repository (recommended) or CLI deploy from local

## Environment variables

### Backend (Render / Railway)

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NODE_ENV` | yes | `production` |
| `PORT` | yes | Render sets this; default `4000` locally |
| `DATABASE_URL` | yes | Managed Postgres URL (`?schema=public&connection_limit=5`) |
| `JWT_SECRET` | yes | ≥32 chars; no placeholders (`change-me`, `dev-only`, …) |
| `JWT_EXPIRES_IN` | no | `8h` |
| `CORS_ORIGIN` | yes | Exact frontend origin(s), comma-separated |
| `BCRYPT_SALT_ROUNDS` | no | `10` |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | no | `900000` |
| `LOGIN_RATE_LIMIT_MAX` | no | `20` |
| `LOG_LEVEL` | no | `info` |

Copy templates from [`backend/.env.example`](../backend/.env.example) and root [`.env.example`](../.env.example).

### Frontend (Vercel)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_BASE_URL` | yes | `https://acme-salary-api.onrender.com/api` |

Vite inlines this at **build** time. Changing the API URL requires a frontend redeploy.

## Database migrations

Migrations live in `backend/prisma/migrations`.

### First deploy / empty database

On API boot, `npm run start:prod` runs:

```bash
prisma migrate deploy && node dist/server.js
```

Manual alternative (Render shell / local against prod URL):

```bash
cd backend
npx prisma migrate deploy
```

### Seed (10,000 employees)

Run **once** after migrations against the managed database (Render shell, GitHub Action, or local laptop with `DATABASE_URL` pointed at prod):

```bash
cd backend
npm run db:seed
```

Seed is idempotent but heavy (~10k rows). Prefer running off-peak. Rotate demo passwords immediately after seeding shared environments.

Default accounts after seed:

| Email | Password | Role |
|-------|----------|------|
| `hr.manager@acme.example` | `ChangeMeNow!123` | HR_MANAGER |
| `super.admin@acme.example` | `ChangeMeNow!123` | SUPER_ADMIN |

## Backend on Render

1. Push this repo to GitHub/GitLab.
2. In Render: **New → Blueprint** and select [`render.yaml`](../render.yaml), **or** create a Web Service with:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Health Check Path:** `/api/health`
3. Attach a Render PostgreSQL instance; set `DATABASE_URL` from the internal connection string.
4. Set `JWT_SECRET` (Generate) and `CORS_ORIGIN` to your Vercel URL (e.g. `https://acme-salary.vercel.app`).
5. Deploy, then open `https://<service>.onrender.com/api/health`.

### CORS

`CORS_ORIGIN` must match the browser origin exactly (scheme + host, no trailing slash unless that is how Vercel serves it). Multiple frontends:

```text
CORS_ORIGIN=https://acme-salary.vercel.app,https://acme-salary-git-main.vercel.app
```

## Frontend on Vercel

1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite (see [`frontend/vercel.json`](../frontend/vercel.json)).
4. Add env `VITE_API_BASE_URL=https://<your-api-host>/api`.
5. Deploy.

SPA routes are rewritten to `index.html` so React Router deep links work.

### CLI deploy (local)

```bash
cd frontend
npx vercel login
npx vercel --prod
```

## Alternative: Railway backend

[`backend/railway.toml`](../backend/railway.toml) provides build/start/healthcheck hints. Create a Railway Postgres plugin and set the same env vars as Render.

## Optional: Docker API

```bash
cd backend
docker build -t acme-api .
docker run --env-file .env -p 4000:4000 acme-api
```

## Build scripts (CI / local verification)

```bash
# From repo root
npm install
npm run build          # backend tsc + frontend vite
npm test               # unit/component tests
```

Backend production entry:

```bash
cd backend
npm run build
npm run start:prod     # migrate + serve
```

## Health checks

| Check | URL |
|-------|-----|
| API liveness + DB | `GET /api/health` → `{ success: true, data: { status: "ok" } }` |
| API root | `GET /` |

Configure Render/Railway health checks to `/api/health`.

## Secure secrets management

- Store secrets only in Vercel/Render/Railway dashboards or a vault.
- Rotate `JWT_SECRET` if leaked (forces re-login).
- Use distinct databases for staging vs production.
- Do not embed secrets in `vercel.json`, `render.yaml`, or git history.
- Free-tier Render services sleep; cold starts can take ~30–60s — health checks should tolerate that.

## Post-deploy checklist

1. `/api/health` returns ok.
2. Frontend loads login page over HTTPS.
3. Login with seeded HR Manager works.
4. Employees list paginates (not blank / CORS errors).
5. Dashboard KPIs load per currency.
6. Report CSV/Excel download works for HR Manager.
7. Demo passwords changed or seed disabled on shared prod.

## Deployment status for this assessment

Attempted during Phase 7 on the development machine:

| Step | Result |
|------|--------|
| Vercel CLI installed | Yes (`vercel` 65.x) |
| `vercel whoami` | **Logged out** — interactive `vercel login` required |
| Anonymous/temporary Vercel deploy | **Failed** (`tar unpack failed` in this environment) |
| Render CLI / managed Postgres | **Not available** without account provisioning |
| Git remote for Blueprint deploy | **None** configured on this local repo |

**Honest status:** production configs and runbooks are complete; a live public deployment was **not** published from this session because cloud authentication and a managed database were not available non-interactively.

To publish:

1. `npx vercel login` then deploy `frontend/` with `VITE_API_BASE_URL`.
2. Connect the repo in Render (Blueprint → `render.yaml`) or create the web service + Postgres manually.
3. Set secrets, migrate/seed, verify `/api/health` and login.
