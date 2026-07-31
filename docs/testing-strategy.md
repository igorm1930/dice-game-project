# Testing Strategy

## Status

Phase 1 through Phase 9 checks have been run locally. Phase 6 through Phase 8
have also passed GitHub-hosted verification. Phase 7 production health, CORS,
frontend, Atlas, persistence, and real idle cold-start checks passed.

The full testing strategy will grow incrementally.

## Phase 9 verification

### Two-seat frontend behavior

- Frontend tests passed: 2 files and 14 tests.
- API-client coverage verifies request bodies, response validation, safe error
  mapping, and exact bearer-token selection.
- Component coverage verifies registration without login, two independent
  sessions, acting-seat selection, isolated logout, 401 session removal, and
  no browser-storage writes.
- Browser verification registered and logged in two isolated temporary users.
- Protected identity checks returned Seat A and Seat B independently from
  their selected tokens.
- Logging out Seat B preserved Seat A; refreshing cleared both sessions.
- The 390px browser layout had no horizontal overflow, and signed-out seat
  regions exposed distinct accessible names.

### Regression and security

- Root verification passed backend/frontend lint, 31 backend unit tests, 30
  backend E2E tests, 14 frontend tests, and both builds.
- Vite transformed 22 modules.
- Backend production and frontend audits reported zero vulnerabilities.
- The known 25 high backend development-tool findings remain unchanged.
- Full-history Gitleaks scanned 26 commits, and the uncommitted Phase 9 diff
  scan found no leaks.
- Static scanning found no browser-storage, cookie, raw-HTML, or private
  frontend-configuration usage in production frontend source.
- Browser logs contained no application errors; warnings came from an
  unrelated extension.
- The temporary two-user manual database was deleted after verification.

## Phase 8 verification

### Authentication and identity

- Backend unit tests passed: 6 suites and 31 tests.
- MongoDB E2E tests passed: 3 suites and 30 tests.
- Coverage includes Argon2id hashing, validation, normalized duplicates,
  generic login failures, valid login, strict JWT failures, rate limits,
  response protection, legacy users, and token-derived identity.
- Missing and short JWT secrets failed startup with clear validation errors.

### Regression and security

- Root verification passed backend/frontend lint, 31 backend unit tests, 30
  backend E2E tests, 4 frontend tests, and both builds.
- Backend production and frontend audits reported zero vulnerabilities.
- The known 25 high backend development-tool findings remain unchanged.
- Gitleaks scanned 25 commits and the Phase 8 diff with no findings.
- Direct MongoDB inspection confirmed Argon2id-only password storage, no
  plaintext password field, normalized usernames, and both required indexes.
- Browser verification showed the connected read-only player list and no
  application warning or error; observed warnings came from an extension.

## Testing principles

- Test every phase before continuing.
- Keep tests deterministic.
- Do not use production databases in tests.
- Do not claim tests passed unless they were executed.
- Report exact commands.
- Report failures honestly.
- Prefer testing behavior over implementation details.
- Game-rule tests must not depend on random values.
- Backend rule tests must not require React.
- Frontend tests must not duplicate game rules.

## Planned test levels

### Backend unit tests

For:

- isolated services
- validation helpers
- pure game engine
- deterministic dice behavior

### Backend integration tests

For:

- controllers
- authentication
- MongoDB repositories
- authorization
- API error handling

### Frontend component tests

For:

- loading states
- success states
- errors
- forms
- server-state rendering
- active-seat behavior

### End-to-end verification

For:

- browser to API
- API to MongoDB
- authentication
- two-user simulation
- complete game flow

## Phase 7 local verification

### Deployment safeguards

- Focused production environment tests passed: 1 suite and 10 tests.
- Production rejects non-HTTPS frontend origins.
- Production rejects non-SRV MongoDB connections.
- Every MongoDB URI requires an explicit database name.
- The API binds to `0.0.0.0` for the hosted container environment.
- Render Blueprint formatting and Docker Compose configuration passed.

### Regression and security checks

- Root verification passed backend/frontend lint, 20 backend unit tests, 11
  backend E2E tests, 5 frontend component tests, and both builds.
- Backend production and frontend dependency audits reported zero
  vulnerabilities.
- The frontend build contained the expected public Render API URL.
- No MongoDB URI, `MONGODB_URI`, `FRONTEND_ORIGIN`, or planned database user
  name appeared in the browser bundle.

### Production verification

- Render deployed the API and static site at the planned public URLs.
- API health returned HTTP 200 with the documented response.
- The exact frontend origin received the expected CORS header; an unapproved
  origin received none.
- The hosted frontend connected to the API, created
  `phase7-check-20260731-1507`, and still displayed it after reload.
- Atlas Data Explorer confirmed one matching document in `dice_game.users`.
- Atlas network access contains exactly the two active Render Frankfurt CIDRs.
- Static headers and the SPA rewrite returned HTTP 200.
- Provider-log inspection found no connection string, database user, password,
  unhandled exception, or error marker.
- Full-history Gitleaks scanned 22 commits with no findings; the uncommitted
  diff scan also found no findings.
- Draft pull request #8 triggered GitHub Actions: Secret scan passed in 6
  seconds and Verify passed in 1 minute 10 seconds.
- After more than 15 idle minutes, the first API health request returned HTTP
  200 in 32.4 seconds, confirming a real free-tier cold start.
- Reloading the hosted frontend after recovery showed the connected state and
  the persisted demonstration user.

## Phase 6 verification

### Continuous integration

- The workflow runs for pull requests and pushes to `main`.
- The verification job uses Node.js 22 and a digest-pinned MongoDB 7.0.39
  service.
- Backend and frontend dependencies install independently from committed
  lockfiles.
- The backend production audit and frontend full audit are blocking.
- Root verification runs backend/frontend lint, 16 backend unit tests,
  11 backend E2E tests, 5 frontend component tests, and both builds.
- Backend lint now checks without silently rewriting source.

### CI security checks

- Workflow permissions are explicitly read-only.
- Checkout credentials are not persisted.
- Actions use full commit SHA references.
- `pull_request_target`, write permissions, persisted credentials, and
  repository-secret references were absent.
- Gitleaks 8.30.1 scanned 19 commits and approximately 685.95 KB.
- The initial finding was the official public NestJS starter badge placeholder.
  Its exact fingerprint is ignored; the repeated scan reported no leaks.
- Pull-request workflow run `30624910984` completed successfully.
- Hosted `Secret scan` passed in 9 seconds.
- Hosted `Verify` passed in 56 seconds, including MongoDB service startup,
  locked installs, audits, lint, all tests, and both builds.

## Phase 5 verification

### Backend unit and integration structure

- Shared Nest application setup is used by production bootstrap and E2E tests.
- `UsersService` unit coverage passed: create, duplicate conflict, ordered
  listing, lookup, and not-found behavior.
- Backend unit tests passed: 5 suites and 16 tests.
- Real-MongoDB E2E tests passed: 2 suites and 11 tests.
- E2E tests run serially against `dice_game_e2e` by default.
- An unsafe `dice_game` URI failed before application startup with the intended
  dedicated-database error.
- Development database user count remained unchanged and the E2E user
  collection was empty after cleanup.

### Frontend component structure

- Vitest 4.1.10 runs with jsdom and React Testing Library.
- Component coverage verifies loading, connected/empty success, saved-user
  rendering, form progress/success, and API/form errors.
- Frontend component tests passed: 1 file and 5 tests.
- The first restricted-sandbox Vitest launch failed with `spawn EPERM`; the
  identical command passed with normal process-spawn access.

### Complete verification and security

- Root `npm.cmd run verify` passed lint, all tests, E2E tests, and both builds.
- Frontend Vite 8.1.5 build passed with 20 transformed modules.
- Backend production audit: 0 vulnerabilities.
- Frontend full audit: 0 vulnerabilities.
- Backend full audit reported the previously documented 25 high-severity
  findings in development tooling through `brace-expansion` and `minimatch`.
  No breaking forced fix was run.
- Only `.env.example` files are tracked; no real environment file, private
  frontend configuration, credential-bearing MongoDB URI, or key material was
  found.
- Browser smoke testing confirmed API connection, empty state, creation,
  rendering, and reload persistence with no application errors. Warnings came
  from an unrelated installed Chrome extension.
- The isolated manual user was deleted and temporary servers were stopped.

## Phase 4 verification

### Backend and database

- `npm.cmd run lint`: passed.
- `npm.cmd test -- --runInBand`: 4 suites and 11 tests passed.
- `npm.cmd run test:e2e -- --runInBand`: 2 suites and 11 tests passed against
  `dice_game_phase4_test`.
- `npm.cmd run build`: passed.
- E2E coverage verified trimming, response-field protection, list/lookup,
  invalid input, unknown fields, case-insensitive duplicates, malformed and
  unknown IDs, and persistence across a Nest application restart.
- Direct runtime checks repeated create, list, lookup, 400, 409, and restart
  persistence behavior against `dice_game_phase4_manual`.
- Configured and disallowed CORS origins retained the expected headers.

### Frontend

- `npm.cmd run lint`: passed.
- Configured `npm.cmd run build`: passed with Vite 8.1.5 and 20 transformed
  modules.
- The development server returned HTTP 200 and included the React root and
  source entry.
- Chrome verified the empty state, successful creation, saved-user rendering,
  case-insensitive duplicate feedback, reload persistence, and native invalid
  username handling.
- Desktop and 390px mobile layouts rendered without overflow or clipping.
- Browser verification found an invalid modern HTML pattern caused by an
  unescaped hyphen. The pattern was corrected; frontend lint, build, and native
  Chromium validation then passed.
- No application console errors were found. Observed warnings came from an
  unrelated installed Chrome extension.

### Dependency and security checks

- Backend production audit: 0 vulnerabilities.
- Backend full audit: 0 vulnerabilities.
- Frontend audit: 0 vulnerabilities.
- Only `.env.example` files are tracked; no real `.env` file was found.
- No credential-bearing MongoDB URI, private frontend configuration, or
  sensitive runtime-log content was found.
- Explicit response DTOs omit MongoDB internals.
- `git diff --check`: passed.

## Phase 3 verification

### Backend and database

- `npm.cmd run lint`: passed.
- `npm.cmd test -- --runInBand`: 4 suites and 11 tests passed.
- `npm.cmd run test:e2e -- --runInBand`: 1 suite and 2 tests passed against
  the isolated Phase 3 database.
- `npm.cmd run build`: passed.
- `docker compose config`: passed.
- MongoDB 7.0.39 became healthy and responded successfully to `ping`.
- The Phase 3 MongoDB port was exposed only as `127.0.0.1:27018`.
- With MongoDB connected, `GET /api/health` returned HTTP 200 and the approved
  fixed JSON payload.
- Stopping MongoDB changed the running API health response to HTTP 503.
- Restarting MongoDB restored HTTP 200 without restarting the API.
- Starting the API while MongoDB was unavailable made exactly three bounded
  connection attempts, then exited with code 1.
- Missing `MONGODB_URI` caused immediate startup validation failure with a
  clear error.

### Frontend regression

- `npm.cmd run lint`: passed.
- Configured `npm.cmd run build`: passed with Vite 8.1.5 and 19 transformed
  modules.

### Dependency and security checks

- Backend production audit: 0 vulnerabilities.
- Backend full audit: 0 vulnerabilities.
- Frontend audit: 0 vulnerabilities.
- Only `.env.example` files are tracked; no real `.env` file was found.
- No private configuration name or MongoDB connection value was found in
  frontend source or build output.
- No credential-bearing MongoDB URI was added.
- `git diff --check`: passed.

## Phase 2 verification

### Backend

- `npm.cmd run lint`: passed without changing tracked backend files.
- `npm.cmd test -- --runInBand`: 2 suites and 2 tests passed.
- `npm.cmd run test:e2e -- --runInBand`: 1 suite and 2 tests passed.
- `npm.cmd run build`: passed.
- Missing `FRONTEND_ORIGIN` caused `npm.cmd run start:prod` to exit with
  `FRONTEND_ORIGIN environment variable is required`.
- A direct `GET /api/health` request returned HTTP 200 and the approved JSON.
- The configured origin received its CORS header; another origin did not.

Port 3000 was already occupied on the fresh-clone computer, so runtime checks
used temporary API port 3001 without changing the documented default.

### Frontend

- `npm.cmd run lint`: passed.
- A build without `VITE_API_URL` failed with
  `VITE_API_URL environment variable is required`.
- A configured `npm.cmd run build` passed with Vite 8.1.5 and transformed 19
  modules.
- The development server started on strict port 5173 and returned HTTP 200.
- The original Phase 2 checkpoint verified loading, success, unavailable, and
  recovery behavior in a browser.
- The connected Codex browser surface was unavailable on the fresh-clone
  computer, so that visual verification was not repeated there.

### Dependency and security checks

- Backend production audit: 0 vulnerabilities.
- Backend full audit: 0 vulnerabilities in normal and JSON audit output.
- Frontend audit: 0 vulnerabilities.
- Backend `npm ci` initially printed the previously recorded 25-high summary,
  but all subsequent audit commands reported zero. No automatic audit fix was
  run.
- Only placeholder `.env.example` files are tracked.
- Real `.env` files are ignored and none were found.
- No private configuration names were found in application source or the
  built frontend.

## Phase 1 foundation evidence

### Backend

- `npm test -- --runInBand`: generated controller unit test passed
  (1 suite, 1 test).
- `npm run test:e2e -- --runInBand`: generated HTTP end-to-end test passed
  (1 suite, 1 test).
- `npm run lint`: completed with no errors and one warning in generated
  `src/main.ts` for the unhandled `bootstrap()` promise.
- `npm run build`: passed.
- `npm run start:dev`: compiled with zero TypeScript errors.
- A request to `http://127.0.0.1:3000/` returned HTTP 200 and
  `Hello World!`.

### Frontend

- No automated frontend tests are generated by the selected Vite template.
- `npm run lint`: passed with Oxlint.
- `npm run build`: passed with Vite 8.1.5; 20 modules were transformed.
- `npm run dev -- --host 127.0.0.1`: started successfully.
- A request to the development server returned HTTP 200 and the generated
  HTML contained the React root and `/src/main.tsx` entry.

Both development servers were stopped after verification. Browser rendering
was not tested through an automated browser in Phase 1.

### Dependency and security checks

The Phase 1 review ran:

```powershell
# From api/
npm.cmd audit --audit-level=high
npm.cmd audit --omit=dev --audit-level=high

# From web/
npm.cmd audit --audit-level=high
```

Results:

- Frontend audit: 0 vulnerabilities.
- Backend production-dependency audit: 0 vulnerabilities.
- Backend full audit: 25 high-severity findings in transitive development
  tooling through `brace-expansion` and `minimatch`.
- `npm outdated` confirmed that the current direct dependencies already match
  their compatible wanted versions.
- `npm audit fix --dry-run` found no compatible non-breaking remediation.
  npm's proposed complete fixes require breaking major changes or problematic
  downgrades.
- `npm audit fix` and `npm audit fix --force` were not run.
- No tracked secret-like values were found.
- No private-configuration patterns were found in the built frontend.
- Root, backend, and frontend `.env` paths are ignored, while
  `.env.example` remains allowed.

The reported development-tooling issue is documented in
[GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg).
It does not affect the current backend production dependency set, but it
remains a known development-tooling risk pending a compatible upstream update.
