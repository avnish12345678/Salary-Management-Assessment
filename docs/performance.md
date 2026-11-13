# Performance Considerations

ACME is designed to keep interactive HR workflows fast at **~10,000 employees** without loading the full workforce into the browser.

## Design principles

1. **Server-side pagination only** for employees, salaries, revisions, audit logs, and reports tables.
2. **Filter in the database**, not in Node memory, whenever possible.
3. **Never cross-aggregate currencies** — grouping by `currency` keeps queries correct and index-friendly.
4. **Batch writes** for seed and bulk manager assignment.
5. **Bounded response sizes** (`pageSize` max 100; report revision diffs capped at 50).

## Database indexes

Already applied in the initial migration:

| Workload | Index |
|----------|--------|
| Employee search / sort | `(last_name, first_name)`, `(employee_code)`, `(email)` |
| Employee filters | `(department_id)`, `(country_id)`, `(employment_status)`, `(designation)`, `(joining_date)` |
| Current + history salaries | `(employee_id, effective_from DESC)` |
| One open salary | partial unique `(employee_id) WHERE effective_to IS NULL` |
| Payroll grouping | `(currency)`, `(effective_from)` |
| Revision trends | `(created_at)`, `(employee_id, created_at DESC)` |
| Audit browsing | `(entity_type, entity_id)`, `(created_at DESC)`, `(actor_user_id)` |

## Query strategy (Phase 6)

### Dashboard & reports

- Payroll KPIs and chart series use **SQL `GROUP BY`** over `salary_records` joined to `employees` (and dimensions).
- Top-10 earners use `ROW_NUMBER() OVER (PARTITION BY currency ...)`.
- Histogram buckets are computed in SQL to avoid shipping 10k rows to Node.
- This replaces the earlier approach of loading all open salaries into application memory.

### Employees list

- Single filtered `findMany` + `count` transaction.
- Current salary is loaded with a constrained include (`effectiveTo: null`, `take: 1`) to avoid N+1 history fetches.

### Seed

- `createMany` batches of 500.
- Manager assignment uses a single `UPDATE ... FROM (VALUES ...)` per batch.

## Connection pooling

Prisma uses the PostgreSQL connection pooler configured via `DATABASE_URL`.

Recommended production URL parameters:

```text
postgresql://USER:PASSWORD@HOST:5432/DB?schema=public&connection_limit=10&pool_timeout=20
```

On serverless hosts, prefer a **PgBouncer / managed pooler** URL and keep `connection_limit` low per instance.

## Frontend performance

- Debounced search (~350ms) on employees, salaries, history, and reports.
- TanStack Query caching reduces repeat fetches while navigating.
- Route-level pages only; charts render after analytics resolve (no blocking of the whole shell).
- Tables never request unbounded result sets.

## Expected latency targets (local/managed Postgres, warm cache)

| Endpoint | Target |
|----------|--------|
| `GET /api/employees?pageSize=20` | < 200ms |
| `GET /api/dashboard/analytics` | < 500ms at 10k rows |
| `GET /api/reports/summary` | < 800ms at 10k rows |
| `POST /api/salaries/.../revisions` | < 300ms (transactional) |

These are engineering targets, not SLAs. Measure with `EXPLAIN ANALYZE` after seeding.

## Future optimizations (out of Phase 6 scope)

- `pg_trgm` GIN indexes for fuzzy name search.
- Materialized views for monthly payroll snapshots.
- Read replicas for heavy reporting.
- HTTP caching for reference data (`/countries`, `/departments`).
