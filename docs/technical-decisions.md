# Technical Decisions

Architecture Decision Records (ADRs) for ACME. Decisions are locked for the assessment unless a later phase discovers a blocking issue.

## ADR-001: Monorepo layout

**Decision:** Single repository with `backend/`, `frontend/`, and `docs/`.  
**Why:** Shared assessment delivery, aligned types/contracts, one git history for incremental commits.  
**Trade-off:** Coupled release cadence; acceptable for this product size.

## ADR-002: Express modular API + Prisma

**Decision:** Node.js Express TypeScript with module folders (controller/service/routes/validation/tests) and Prisma ORM.  
**Why:** Matches required stack; clear separation of concerns; Prisma migrations and typed client speed development while supporting PostgreSQL `NUMERIC`.  
**Trade-off:** Complex analytics may use `$queryRaw` for aggregations; documented and tested.

## ADR-003: JWT access tokens (stateless)

**Decision:** Short-lived JWT Bearer tokens; bcrypt password hashes; logout is client-side token discard (optional denylist deferred).  
**Why:** Simple horizontal scale on Render; no session store required for MVP.  
**Trade-off:** Immediate server-side revoke needs denylist later; out of scope.

## ADR-004: RBAC role matrix

**Decision:** Four roles with explicit route guards. HR Executive: employee CRUD + salary read; no salary mutations or salary export writes. Viewer: read-only.  
**Why:** Assessment requires RBAC without building a full permission-assignment UI.  
**Trade-off:** No per-department ACL table in v1; department filters remain query filters, not row-level security.

## ADR-005: Money as NUMERIC / Decimal

**Decision:** Store all monetary fields as `NUMERIC(14,2)` / Prisma `Decimal`. Compute gross/net in services.  
**Why:** Floating-point is unsafe for payroll.  
**Trade-off:** Slightly more verbose client serialization; handled via string/Decimal helpers.

## ADR-006: No cross-currency aggregation

**Decision:** Dashboard and reports always group financial KPIs by currency. UI labels currency explicitly. No FX conversion service.  
**Why:** Incorrect totals are worse than multiple totals. FX is excluded from scope.  
**Trade-off:** HR sees multiple KPI rows when filters span currencies.

## ADR-007: Salary history via close-and-insert

**Decision:** Never update historical amount columns in place for corrections of record; close open period and insert a new `salary_records` row; link via `salary_revisions`.  
**Why:** Full auditability and non-overlapping periods.  
**Trade-off:** More rows; mitigated by indexes and pagination.

## ADR-008: TanStack Query + Axios + RHF/Zod on frontend

**Decision:** Server state via TanStack Query; forms via React Hook Form + Zod; HTTP via Axios.  
**Why:** Required stack; caching, retries, and consistent validation align with server Zod schemas.  
**Trade-off:** Duplicate schema definitions FE/BE unless shared package added later.

## ADR-009: MUI enterprise theme

**Decision:** Material UI with custom ACME theme tokens (typography, spacing, sidebar shell)—not a stock template look.  
**Why:** Assessment UI/UX bar; reusable components and accessibility primitives.  
**Trade-off:** Bundle size; acceptable with Vite code-splitting by route.

## ADR-010: Testing pyramid

**Decision:** Jest + Supertest (API), React Testing Library (UI), Playwright (critical E2E). Deterministic DB fixtures; no flaky sleeps.  
**Why:** Required tools; meaningful coverage over vanity test counts.  
**Trade-off:** E2E slower; limited to login, employee create, salary revision, report export.

## ADR-011: Deployment targets

**Decision:** Frontend on Vercel, API on Render, managed PostgreSQL. Env-based config; `.env.example` only—never commit secrets.  
**Why:** Matches assessment deployment section; free/hobby tiers suitable for demo.  
**Trade-off:** Cold starts on free tiers; documented in deployment docs (Phase 7).

## ADR-012: Deterministic seed

**Decision:** Fixed RNG seed in `prisma/seed.ts`; batch inserts; upserts for reference data and HR user; exactly 10,000 employees; safe re-run.  
**Why:** Reproducible demos and tests.  
**Trade-off:** Seed runtime; mitigated with batches and indexes after insert.
