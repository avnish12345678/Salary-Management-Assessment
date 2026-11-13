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
