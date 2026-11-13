# AI Development Log

This log records how AI assistance was used on the ACME assessment. Entries are honest: tests are only marked as executed when they were actually run.

## Phase 1 — Requirements & architecture (2026-11-13)

### Tasks delegated to AI

- Inspect workspace and confirm greenfield (empty) state.
- Draft product requirements (one-pager).
- Draft system architecture, database design, technical ADRs, and this log.
- Propose locked decisions (monorepo, RBAC matrix, Decimal money, no FX aggregation, deploy targets).

### Prompts / instructions used (summary)

- Full ACME assessment brief (stack, modules, 10k seed, RBAC, dashboard, reports, testing, git strategy).
- Explicit instruction: **start with Phase 1 only**; do not implement application code yet.
- Plan execution: create `/docs/*.md`, initialize git, commit documentation only.

### Architectural decisions (human-locked with AI drafting)

- Monorepo with modular Express + Prisma backend and feature-based React frontend.
- Close-and-insert salary history with transactional audit.
- Currency-grouped analytics only.
- HR_EXECUTIVE: employee write + salary read; no salary mutations.
- VIEWER: read-only; no sensitive export mutations.

### AI-generated content reviewed

| Artifact | Review focus |
|----------|----------------|
| `docs/requirements.md` | Scope vs exclusions; success criteria map to acceptance checklist |
| `docs/architecture.md` | Module boundaries, security middleware, API envelope |
| `docs/database-design.md` | Required tables, NUMERIC money, partial unique open salary, indexes |
| `docs/technical-decisions.md` | ADR clarity and trade-offs |
| `README.md` | Points to docs; no false “ready to run” claims |

### Bugs / incorrect suggestions discovered

- None in executable code (no application code in Phase 1).
- Clarified during planning: do not store gross/net as sole source of truth; compute from components.
- Clarified: partial unique index on open salary (`effective_to IS NULL`) plus service-level overlap checks.

### Corrections applied

- RBAC for HR_EXECUTIVE and VIEWER made concrete in architecture (not left as vague “assigned permissions”).
- Explicit “no tests executed” for Phase 1.

### Testing and verification performed

| Check | Result |
|-------|--------|
| Workspace empty before Phase 1 | Confirmed |
| Docs files created under `/docs/` | Confirmed by write |
| Application / unit / E2E tests | **Not run** — no app code yet |
| Seed of 10,000 employees | **Not run** — deferred to Phase 5 |
| Deployment | **Not claimed** — deferred to Phase 7 |

### Next phase

Phase 2: scaffold backend/frontend, Prisma schema/migrations, authentication and RBAC.

---

## Phase 2 — Scaffold, schema, authentication (2026-11-13)

### Tasks delegated to AI

- Scaffold npm workspaces monorepo (`backend/`, `frontend/`).
- Implement Prisma schema + SQL migration (including partial unique open salary index).
- Implement Express app with helmet/CORS, health check, JWT auth, bcrypt, RBAC permissions, login rate limit.
- Implement React login UI, AuthContext, protected routes, ACME app shell.
- Write Jest unit tests and Vitest login validation test; optional DB integration tests gated by `RUN_DB_TESTS`.
- Add `docker-compose.yml` for PostgreSQL and `.env.example` files.

### Prompts / instructions used (summary)

- “Complete phase 2” after Phase 1 docs approval.
- Assessment Phase 2: set up backend, frontend, database, and authentication.
- Locked decisions from Phase 1 plan (RBAC matrix, Decimal money, monorepo).

### Architectural decisions reinforced

- Bootstrap seed creates HR Manager + Super Admin + reference countries/departments only; 10k employees deferred to Phase 5.
- Auth integration tests skipped by default without PostgreSQL (`RUN_DB_TESTS=true` to enable).
- MUI v9 system props: prefer `sx` for spacing/fontWeight to satisfy TypeScript.

### AI-generated code reviewed

| Area | Review focus |
|------|----------------|
| Prisma schema/migration | Required tables, NUMERIC(14,2), partial unique index |
| Auth service | No password hash in responses; generic login failure message |
| Middleware | JWT verify + active user check; permission matrix |
| Frontend AuthContext | Token persistence; 401 interceptor logout |
| Tests | Deterministic unit tests; honest skip for DB integration |

### Bugs discovered during validation

1. Jest failed parsing `jest.config.ts` without `ts-node` → switched to `jest.config.js`.
2. Test env set `BCRYPT_SALT_ROUNDS=4` but schema requires ≥8 → corrected to 8.
3. Frontend build failed on MUI v9 typings for `mb`/`fontWeight` props → moved to `sx`.
4. No local PostgreSQL/Docker on the development machine → migrations not applied in this environment; SQL migration checked into repo for deploy/local Docker use.

### Corrections applied

- Fixed Jest config and bcrypt salt rounds for tests.
- Fixed Login/AppLayout/Placeholder MUI typings.
- Documented DB prerequisite and bootstrap credentials in README.
- Did **not** claim DB integration tests or 10k seed ran.

### Testing and verification performed

| Check | Result |
|-------|--------|
| `npm run test --workspace=backend` | **Passed** — 4 suites / 9 tests; 1 suite skipped (DB integration) |
| `npm run test --workspace=frontend` | **Passed** — 1 test (login validation) |
| `npm run build --workspace=backend` | **Passed** |
| `npm run build --workspace=frontend` | **Passed** |
| `prisma migrate deploy` / live login against PostgreSQL | **Not executed** — PostgreSQL not available on this machine |
| 10,000 employee seed | **Not run** — Phase 5 |
| Deployment | **Not claimed** |

### Next phase

Phase 3: employee and salary management APIs + UI (pagination, filters, revisions, transactions, audit).

---

## Phase 3 — Employee & salary management (2026-11-13)

### Tasks delegated to AI

- Implement employees APIs: list/search/filter/sort/paginate, create/update, activate/deactivate, designations meta.
- Implement salaries APIs: current, history, revisions, compare, revise (transactional close-and-insert + audit).
- Implement countries/departments list APIs.
- Extend bootstrap seed with 5 multi-currency sample employees (still not 10k).
- Build Employees, Employee detail, Salary Management, and Salary History UI with RBAC-aware actions.
- Add unit/validation tests and an EmployeesPage rendering test.

### Architectural decisions reinforced

- Gross/net computed in services; monetary values serialized as fixed 2-decimal strings.
- Overlap prevention in salary service + DB partial unique open period.
- HR_EXECUTIVE can write employees / read salaries; salary revisions require `salaries:write`.
- Debounced client search; all listing remains server-paginated.

### Bugs discovered during validation

1. MUI v9 TypeScript: `justifyContent`, `display`, and `InputLabelProps` rejected → moved to `sx` / `slotProps`.
2. Validate middleware typing too narrow for Zod `superRefine` schemas → switched to `ZodTypeAny`.

### Testing and verification performed

| Check | Result |
|-------|--------|
| Backend Jest | **Passed** — 7 suites / 16 tests; DB integration still skipped |
| Frontend Vitest | **Passed** — 2 tests (login + employees table) |
| Backend build | **Passed** |
| Frontend build | **Passed** |
| Live DB migrate/seed/API smoke | **Not executed** — PostgreSQL unavailable on this machine |
| 10,000 employee seed | **Not run** — Phase 5 |

### Next phase

Phase 4: dashboard analytics and salary reporting/exports (currency-safe aggregations).

---

## Phase 4 — Dashboard & reports (2026-11-13)

### Tasks delegated to AI

- Implement dashboard analytics API with KPI + chart payloads, filters, and per-currency payroll totals.
- Implement reports summary API answering the eight HR payroll questions.
- Add CSV/Excel export with `reports:export` authorization gate.
- Build Dashboard and Reports UI (Recharts + filterable tables + download actions).
- Add unit/component tests for filters, CSV helper, and dashboard rendering.

### Architectural decisions

- Current open gross salary treated as annual compensation for payroll KPIs (documented in API notes).
- Financial rankings/top-N computed independently per currency.
- Export formats share the same filter validation and permission checks as JSON reports.

### Bugs discovered during validation

1. Dashboard test asserted `getByText('5')` but both total employees and countries covered were 5 → assert unique active count instead.
2. exceljs installed for XLSX generation; CSV kept dependency-free.

### Testing and verification performed

| Check | Result |
|-------|--------|
| Backend Jest | **Passed** — 9 suites / 19 tests; DB integration skipped |
| Frontend Vitest | **Passed** — 3 tests |
| Backend + frontend builds | **Passed** |
| Live analytics against PostgreSQL | **Not executed** — DB unavailable on this machine |
| 10k seed | **Not run** — Phase 5 |

### Next phase

Phase 5: deterministic 10,000-employee seed + broader automated tests.
