# Current Phase

## Phase

Phase 8 - Authentication

## Status

Phase 8 backend authentication is implemented, locally verified, and approved
by the developer on `phase/08-authentication`. It has not been committed,
pushed, deployed, or merged.

## Implemented scope

- Added Argon2id password hashing with the approved parameters.
- Added rate-limited registration and login endpoints.
- Added 30-minute HS256 JWT access tokens and strict claim verification.
- Added protected current-user lookup derived only from JWT `sub`.
- Added validated backend-only JWT configuration.
- Added normalized username persistence and the required unique index.
- Excluded password hashes from normal queries and explicit responses.
- Removed unauthenticated `POST /api/users`.
- Preserved legacy passwordless records as read-only public users.
- Changed the frontend to a read-only player list until Phase 9.
- Added unit, MongoDB E2E, configuration, security, and regression coverage.

## Local verification

- Backend lint passed.
- Backend unit tests passed: 6 suites and 31 tests.
- MongoDB E2E tests passed: 3 suites and 30 tests.
- Frontend lint and component tests passed: 1 file and 4 tests.
- Backend and frontend builds passed; Vite transformed 20 modules.
- Root verification passed.
- Backend production and frontend dependency audits found zero vulnerabilities.
- The known backend development-tool audit remains at 25 high findings.
- Gitleaks found no leaks in 25 commits or the Phase 8 diff.
- Manual registration, login, current-user, identity-spoof resistance, hash-only
  storage, required indexes, configuration failures, and browser rendering
  passed.

## Security boundary

- `JWT_SECRET` is a backend-only runtime secret containing at least 32 bytes.
- No production or reusable test secret exists in source.
- Passwords, password hashes, JWTs, and authorization headers are not logged.
- CORS remains exact-origin with credentials disabled.
- Rate limits use per-process memory and Render's forwarded client IP.
- Authentication does not authorize future game actions.

## Known compatibility state

The existing Phase 7 demonstration user has no password hash and cannot log in.
It remains visible through the public read-only user endpoints, reports zero
wins, and keeps its case-insensitive username reserved. No production data has
been migrated or deleted.

## Out of scope

- Phase 9 Seat A and Seat B frontend sessions
- Frontend token storage or login forms
- Refresh tokens, cookies, OAuth, or password recovery
- Game authorization, rules, endpoints, or persistence
- Production `JWT_SECRET` entry or Phase 8 deployment verification
- Commit, push, pull request, merge, or Phase 9 work

## Next action

Wait for explicit commit/push instructions and separate approval for production
provider changes. Do not deploy, merge, or start Phase 9 without explicit
approval.
