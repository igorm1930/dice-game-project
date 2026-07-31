# Session 008 - Authentication

## Goal

Turn new persistent users into authenticated users without starting the Phase 9
two-seat frontend session model.

## Implemented

- Added validated JWT runtime configuration with no fallback secret.
- Added Argon2id registration using memory cost 19456, time cost 2, and
  parallelism 1.
- Added generic username/password login and 30-minute HS256 bearer tokens.
- Added strict token verification and protected `GET /api/auth/me`.
- Added per-IP registration and login throttling.
- Added normalized username and win fields plus excluded password hashes.
- Removed unauthenticated user creation and made the current frontend list-only.
- Preserved legacy passwordless records without migrating or deleting data.

## Verification

- Backend lint: passed.
- Backend unit tests: 6 suites and 31 tests passed.
- Backend E2E tests: 3 suites and 30 tests passed against MongoDB.
- Frontend lint: passed.
- Frontend tests: 1 file and 4 tests passed.
- Backend and frontend builds: passed.
- Root `npm.cmd run verify`: passed.
- Backend production audit: 0 vulnerabilities.
- Frontend audit: 0 vulnerabilities.
- Backend full audit: the previously documented 25 high development-tool
  findings remain; no forced breaking fix was run.
- Full-history Gitleaks: 25 commits, no leaks.
- Uncommitted Phase 8 diff scan: no leaks.

Manual checks confirmed registration does not return a token, login returns a
Bearer token with a 1,800-second lifetime, `/auth/me` ignores a spoofed user ID,
invalid credentials use the approved generic response, MongoDB stores an
Argon2id hash without plaintext, and both required username indexes exist.
Missing and short JWT secrets failed startup with the intended clear errors.
The browser showed the connected read-only player list with no application
console errors; warnings came from an unrelated installed extension.

## Security review

- Passwords are never normalized, persisted, returned, or logged.
- Password hashes and normalized usernames are excluded from normal queries.
- JWT verification constrains algorithm, signature, expiry, issuer, audience,
  subject, username, issued-at time, and token use.
- Test secrets are generated at runtime and no JWT secret enters frontend code.
- Registration and login use in-memory per-IP rate limits.
- Existing CORS and validation-pipe protections remain unchanged.

## Remaining

Production `JWT_SECRET` entry and Phase 8 deployment verification require
separate approval. Commit, push, pull request, merge, and Phase 9 are not part
of this implementation checkpoint.

The developer approved the locally verified Phase 8 implementation after
review. This approval did not authorize a commit, push, deployment, merge, or
Phase 9 work.
