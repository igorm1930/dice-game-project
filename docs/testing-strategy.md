# Testing Strategy

## Status

Phase 1 through Phase 14 checks have been run locally. Phase 6 through Phase 10
have also passed GitHub-hosted verification. Phase 7 production health, CORS,
frontend, Atlas, persistence, and real idle cold-start checks passed.

The full testing strategy will grow incrementally.

## Phase 14 verification

### API hardening

- Focused exception-filter, request-logging, version-header, game-service,
  repository, user-service, and health tests passed: 7 suites and 44 tests.
- Unit coverage verifies normalized errors, hidden unexpected details,
  metadata-only logs, strong version parsing, atomic version conflicts, and
  idempotent win counting.
- MongoDB E2E coverage passed: 4 suites and 47 tests.
- E2E coverage verifies health aliases, OpenAPI, versioned mutations,
  missing/malformed preconditions, one-winner concurrent mutation behavior,
  restart, persistence, normalized errors, and idempotent lifetime wins.

### Frontend polish

- Frontend coverage passed: 4 files and 40 tests.
- Coverage verifies quoted `If-Match` headers, strict version parsing,
  stale-state recovery, mutation gating, lifetime-win refresh, double-six and
  winner status, accessible state, and new-game behavior.
- Browser verification registered and signed in two isolated users, completed
  a target-1 game, observed the winner and lifetime-win update, restarted the
  game, and retained the lifetime win.
- Desktop, 768px, and 390px layouts rendered without visible clipping or
  horizontal overflow.
- Swagger UI exposed the documented API tags, operations, schemas, and bearer
  authorization control.

### Regression and security

- Root verification passed backend/frontend lint, 95 backend unit tests, 47
  backend E2E tests, 40 frontend tests, and both builds.
- Vite transformed 24 modules.
- An unconfigured frontend build failed with the intended
  `VITE_API_URL environment variable is required` error.
- Backend production, backend full, and frontend audits reported zero
  vulnerabilities.
- Full-history Gitleaks scanned 34 commits with no leaks; focused backend,
  frontend, and documentation scans also found no leaks.
- Runtime logs used route templates and contained no request bodies,
  credentials, tokens, user IDs, or game IDs.
- Browser logs contained no application warnings or errors; warnings came from
  an unrelated extension.
- Temporary processes and logs were removed, and the isolated manual database
  was dropped and confirmed absent.

### Production verification

- Pull request #15 passed Verify and Secret scan before merge.
- Post-merge `main` CI passed Verify and Secret scan.
- Render reported the API and static site live on merge commit `1a7407d`.
- Production liveness and readiness returned HTTP 200.
- Swagger UI and OpenAPI JSON exposed the Phase 14 contracts.
- The deployed frontend connected successfully and its assets contained
  conflict recovery, lifetime wins, `If-Match`, reduced-motion, and winner
  feedback.
- Exact-origin CORS remained allowed and an unapproved origin received no
  permission.
- Provider logs showed successful startup, health traffic, no application
  error, and no sensitive value.
- Production verification created no user or game data.

## Phase 13 verification

### MongoDB game persistence

- Focused repository and service tests passed: 2 suites and 14 tests.
- Repository coverage verifies UUID creation, complete state serialization,
  rehydration, missing records, complete updates, and disappearing-record
  failure.
- Focused game HTTP coverage passed: 1 suite and 12 tests against real MongoDB.
- The game E2E suite closes and recreates the Nest application after Roll,
  Hold, double-six, victory, and Restart, then verifies the exact state and
  caller-specific permissions.
- Focused frontend App coverage passed: 1 file and 14 tests with the unchanged
  game-client contract.

### Regression and security

- Root verification passed backend/frontend lint, 75 backend unit tests, 42
  backend E2E tests, 36 frontend tests, and both builds.
- Vite transformed 24 modules.
- Backend production and frontend dependency audits reported zero
  vulnerabilities.
- The unchanged backend development-tool audit reported the previously
  documented 25 high findings through `brace-expansion` and `minimatch`;
  the complete npm fix requires breaking forced upgrades and was not run.
- Full-history Gitleaks scanned 33 commits with no leaks. Focused game-source
  and documentation scans also found no leaks.
- No dependency, environment variable, endpoint, access-token storage, or
  client-side game authority was added.

### Manual recovery

- The built API and Vite frontend ran against an isolated local database.
- Two temporary authenticated players created a target-20 game and rolled 2
  and 4 for a round score of 6.
- After stopping and replacing the API process, changing the acting seat
  refetched the exact players, target, scores, round score, dice, turn, and
  caller-specific permissions.
- The recovered game continued with Hold and banked 6 points.
- Restart reset the game; a second API-process restart recovered the exact
  reset state.
- Browser logs contained no application warnings or errors; warnings came from
  an unrelated extension.
- Temporary processes, database, and logs were removed after verification.

## Phase 12 verification

### Playable React game

- Focused game API, GameBoard, and App tests passed: 3 files and 31 tests.
- Coverage verifies exact bearer tokens and request bodies, strict response
  validation, setup target submission, server-state rendering,
  caller-specific actions, seat-change refetching, Roll/Hold/Restart updates,
  victory, missing games, and selective 401 session removal.
- Browser verification registered and signed in two isolated users, created a
  target-20 game, rolled, held, switched the acting seat, restarted from the
  other participant, and played through a win.
- Roll and Hold were disabled for the wrong participant and after victory;
  Restart followed the server-provided permission.
- The 390px layout had no horizontal overflow.
- Stopping the temporary API produced a visible `Failed to fetch` alert while
  preserving the rendered game state.

### Regression and security

- Root verification passed backend/frontend lint, 70 backend unit tests, 42
  backend E2E tests, 36 frontend tests, and both builds.
- Vite transformed 24 modules.
- Backend production, backend full, and frontend dependency audits reported
  zero vulnerabilities.
- Full-history Gitleaks scanned 32 commits with no leaks. The full directory
  scan found only the verified public NestJS badge URL; a focused frontend scan
  found no leaks.
- Static scanning found no production browser-storage, cookie, raw-HTML, or
  client-side randomness use.
- Browser logs contained no application warnings or errors before the
  deliberate API outage; warnings came from an unrelated extension.
- No dependency, secret, environment variable, backend source, or database
  schema was added.

## Phase 11 verification

### Authenticated game API

- Focused game-service, user-service, and engine tests passed: 3 suites and 46
  tests.
- New game HTTP coverage passed: 1 suite and 12 tests against real MongoDB with
  deterministic injected dice.
- Coverage verifies JWT protection, create validation, credentialed opponents,
  caller-specific permissions, hidden-record 404 behavior, authoritative-field
  rejection, turn conflicts, Roll, Hold, double six, victory, finished-game
  conflicts, Restart, and UUID validation.
- A direct built-API flow registered and logged in two isolated users, created
  and retrieved a game, rejected the wrong turn, produced valid backend dice,
  held, and restarted successfully.

### Regression and security

- Root verification passed backend/frontend lint, 70 backend unit tests, 42
  backend E2E tests, 14 frontend tests, and both builds.
- Vite transformed 22 modules.
- Backend production, backend full, and frontend dependency audits reported
  zero vulnerabilities.
- Full-history Gitleaks scanned 31 commits with no leaks.
- The working-tree scan found exactly the verified public NestJS badge URL in
  `api/README.md` and no other finding; the exact historical ignore entry was
  not broadened.
- No dependency, environment variable, secret, frontend game rule, or MongoDB
  game schema was added.

## Phase 10 verification

### Pure game rules

- Focused game-engine coverage passed: 1 suite and 29 deterministic tests.
- Coverage verifies initial state, default and custom winning scores, invalid
  players and targets, repeated rolls, ordinary single sixes, double-six busts,
  both players' Hold behavior, exact and above-target wins, post-win rejection,
  invalid dice-provider output, restart, and immutable prior state.
- Dice values come from an injected sequence; no test depends on randomness.
- The compiled engine was loaded directly and traced through Roll, Hold,
  double-six, turn switching, and Restart without NestJS or MongoDB.

### Regression and security

- Root verification passed backend/frontend lint, 60 backend unit tests, 30
  backend E2E tests, 14 frontend tests, and both builds.
- Vite transformed 22 modules.
- Backend production and frontend audits reported zero vulnerabilities.
- The known 25 high backend development-tool findings remain unchanged.
- Full-history Gitleaks scanned 29 commits with no leaks.
- A local Phase 10 file scan found no credential, private-key, or
  secret-assignment patterns.
- No dependency, secret, environment variable, API, database field, or
  frontend game logic was added.

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
