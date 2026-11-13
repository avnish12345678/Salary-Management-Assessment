# Security Review (Phase 6)

Review date: 2026-11-13. Scope: ACME API + SPA authentication, authorization, and data protection controls.

## Summary

No critical unprotected private APIs were found. Phase 6 hardening focused on production secret policy, global API rate limiting, helmet defaults, and completing audit-log read access with RBAC.

## Findings and remediation

| ID | Severity | Finding | Remediation |
|----|----------|---------|-------------|
| S1 | High | Weak/placeholder JWT secrets could be used in production | `JWT_SECRET` must be ≥32 chars in production; placeholder patterns rejected |
| S2 | Medium | Only login was rate-limited | Added `/api` general rate limiter (stricter in production) |
| S3 | Medium | Audit logs were written but not browsable | Added `GET /api/audit` + UI gated by `audit:read` |
| S4 | Low | `X-Powered-By` disclosed Express | Disabled via `app.disable('x-powered-by')` |
| S5 | Info | Stateless JWT logout is client-side discard | Documented; server denylist deferred |

## Controls verified

- Passwords hashed with bcrypt; hashes never returned in API payloads.
- JWT verified on private routes; inactive users rejected even with valid tokens.
- RBAC permission matrix enforced in middleware (`employees:*`, `salaries:*`, `reports:export`, `audit:read`).
- Login failures use a generic message (no user enumeration via distinct errors).
- Request body limited to 1mb; Zod validation on mutating/query inputs.
- CORS allowlist from env; Helmet enabled.
- Salary mutations require `salaries:write` and run inside DB transactions with audit rows.
- Exports require `reports:export` in addition to `reports:read`.

## Residual risks / deferred

- No refresh-token rotation or server-side token revocation list.
- No SSO/MFA (explicitly out of product scope).
- Free-tier deploy platforms may terminate TLS at the edge; ensure `trust proxy` remains enabled behind reverse proxies.
- Seeded demo passwords must be rotated before any shared environment.

## Verification performed

- Static review of auth/RBAC/middleware modules.
- Automated unit tests for permissions, validation, and money correctness.
- Production JWT secret policy enforced in env schema.
- Full DB penetration testing **not** performed in this environment (no live Postgres available during development).
