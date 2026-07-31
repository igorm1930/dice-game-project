# Project Checklist

> Only mark an item complete after it has been implemented, verified, reviewed, committed, and pushed when applicable.

## Project preparation

- [x] Git repository created
- [x] GitHub repository created
- [x] Local repository connected to GitHub
- [x] AGENTS.md created
- [x] CLAUDE.md created
- [x] README.md created
- [x] PROJECT_DECISIONS.md created
- [x] PROJECT_ROADMAP.md created
- [x] CURRENT_PHASE.md created
- [x] Supporting docs created
- [x] Documentation committed
- [x] Documentation pushed successfully

## Security checklist for every phase

- [x] Security impact reviewed
- [x] No secrets or credentials added to source
- [x] Environment-variable changes documented
- [x] `.env.example` updated where applicable
- [x] `.gitignore` verified
- [x] Client bundle contains no private configuration
- [x] Logs checked for sensitive data
- [x] Dependency/security checks run where applicable

## Phase 1 — Project foundation

Status: Completed.

Security follow-up: Completed and pushed in commit `7f699a1`.

### Roadmap checklist

- [x] Create a root `.gitignore`
- [x] Create the project security policy
- [x] Create NestJS backend in `api/`
- [x] Create React, TypeScript, and Vite frontend in `web/`
- [x] Run both applications independently
- [x] Understand important generated files
- [x] Run generated tests and builds

### Completion criteria

- [x] `api/` exists
- [x] `web/` exists
- [x] NestJS starts successfully
- [x] React starts successfully
- [x] Generated backend tests pass
- [x] Backend build passes
- [x] Frontend build passes
- [x] No Phase 2 or later functionality is added
- [x] Changed files are explained
- [x] Git status is shown
- [x] No commit is created automatically

## Phase 2 — API connection

Status: Completed, verified, reviewed, and committed in `53b5555`.

Verification summary:

- Backend lint, unit tests, end-to-end tests, and build passed.
- Frontend lint and configured build passed.
- Missing backend and frontend configuration failed clearly.
- Direct health and exact-origin CORS checks passed.
- Dependency audits and configuration scans passed.
- Original checkpoint browser verification covered loading, success, and error
  states; the fresh-clone browser surface was unavailable for a repeat check.

- [x] Add `GET /api/health`
- [x] Add public frontend API URL configuration with `VITE_API_URL`
- [x] Add backend frontend-origin configuration
- [x] Document the public configuration values
- [x] Connect React to the backend
- [x] Display loading, success, and error states
- [x] Test the endpoint directly
- [x] Test the frontend-to-backend flow
- [x] Resolve local CORS or development-proxy configuration

## Phase 3 — MongoDB connection

Status: Completed, reviewed, committed, and pushed. Awaiting merge to `main`.

Verification summary:

- Typed configuration tests, database-health tests, and existing unit tests
  passed: 4 suites and 11 tests.
- Live-MongoDB end-to-end tests passed: 1 suite and 2 tests.
- Connected, unavailable, startup-failure, and recovery behavior were verified.
- Backend and frontend lint/build regression checks passed.
- Dependency audits and configuration/security scans passed.
- MongoDB is bound only to `127.0.0.1:27018`.

- [x] Add Mongoose
- [x] Add private MongoDB environment configuration
- [x] Add typed NestJS configuration validation
- [x] Add `.env.example`
- [x] Connect NestJS to MongoDB
- [x] Verify successful database connection
- [x] Verify understandable failure behavior

## Phase 4 — Persistent user flow

Status: Completed and merged to `main` in `12196ad`.

Verification summary:

- Backend unit tests passed: 4 suites and 11 tests.
- Real-MongoDB end-to-end tests passed: 2 suites and 11 tests.
- Direct runtime checks verified create, list, lookup, validation, duplicate,
  extra-field rejection, and persistence across API restart.
- Backend/frontend lint and builds passed; all dependency audits reported zero.
- Chrome verified creation, duplicate feedback, reload persistence, native
  invalid-input handling, and desktop/mobile rendering.

- [x] Create the first user schema
- [x] Create a user-creation endpoint
- [x] Create a simple React user form
- [x] Store users in MongoDB
- [x] Display created users
- [x] Verify persistence after backend restart

## Phase 5 — Automated testing foundation

Status: Completed and merged to `main` in `4729338`.

Verification summary:

- Root verification, backend/frontend lint, backend/frontend builds, 16 unit
  tests, 11 E2E tests, and 5 frontend component tests passed.
- Unsafe database selection failed before startup; the development database
  remained unchanged and E2E cleanup finished empty.
- Backend production and frontend audits reported zero vulnerabilities; the
  unchanged backend development-tool audit finding remains documented.
- Browser smoke testing passed with isolated data and no application errors.

- [x] Add backend unit-test structure
- [x] Add backend integration-test structure
- [x] Add frontend component tests
- [x] Use a separate test database
- [x] Add root-level test and build commands when appropriate

## Phase 6 — Continuous integration

Status: Completed and merged to `main` in `972cf8f`.

Verification summary:

- Clean installs, backend production audit, frontend audit, lint, 16 backend
  unit tests, 11 backend E2E tests, 5 frontend tests, and both builds passed.
- MongoDB was healthy and Compose configuration passed.
- Gitleaks scanned all 19 commits with no remaining findings.
- Workflow permissions and credential-handling scans passed.
- Pull-request GitHub Actions run `30624910984` passed.
- Main-branch GitHub Actions run `30625300406` passed: `Secret scan` in 9
  seconds and `Verify` in 1 minute 1 second.

- [x] Add GitHub Actions
- [x] Configure CI secrets and least-privilege workflow permissions
- [x] Add dependency and secret scans
- [x] Install dependencies
- [x] Run lint
- [x] Run tests
- [x] Build backend
- [x] Build frontend
- [x] Add MongoDB service when integration tests require it

## Phase 7 — Initial deployment flow

Status: Completed and merged to `main` in `dd3e1bc`.

Local verification summary:

- Production environment validation passed: 1 suite and 10 tests.
- Root lint, 20 backend unit tests, 11 backend E2E tests, 5 frontend component
  tests, and both builds passed.
- Production dependency audits, Compose validation, Blueprint formatting, and
  frontend private-configuration scans passed.
- Render API/static services and the Atlas M0 cluster are live on free plans.
- Production health, exact-origin CORS, browser user creation, Atlas document
  storage, and reload persistence passed.
- Full-history and uncommitted-diff Gitleaks scans found no leaks.
- Draft pull request #8 passed Verify and Secret scan.
- Post-merge `main` Verify and Secret scan also passed.
- The real free-tier API cold start returned HTTP 200 in 32.4 seconds, and the
  hosted frontend reconnected with the persisted user still visible.

- [x] Deploy frontend
- [x] Deploy backend
- [x] Connect production MongoDB
- [x] Configure environment variables
- [x] Verify health endpoint
- [x] Verify persistent user flow in production
- [x] Confirm CI still passes

## Phase 8 — Authentication

Status: Completed and merged to `main` in `ee1bae5`.

- [x] Add and validate authentication secrets
- [x] Run a security review of authentication and authorization controls
- [x] Add password hashing
- [x] Add registration
- [x] Add login
- [x] Add JWT generation and validation
- [x] Add protected routes
- [x] Add current-user endpoint
- [x] Test invalid, missing, and valid credentials

## Phase 9 — Two authenticated users on one page

Status: Completed and merged to `main` through pull request #10 in
`8b26fce`.

- [x] Add Seat A session
- [x] Add Seat B session
- [x] Add active acting-user selector
- [x] Select JWT per request
- [x] Verify both identities remain independent
- [x] Verify backend identity comes from the token

## Phase 10 — Pure backend game engine

Status: Implemented and locally verified on
`phase/10-pure-game-engine`. Awaiting developer review and approval; not
committed or pushed.

- [ ] Define game state
- [ ] Implement game creation
- [ ] Implement roll
- [ ] Implement Hold
- [ ] Implement turn switching
- [ ] Implement double-six behavior
- [ ] Implement winner detection
- [ ] Inject deterministic dice roller
- [ ] Add complete game-rule unit tests
- [ ] Keep engine independent of HTTP and MongoDB

## Phase 11 — In-memory game API

- [ ] Add game endpoints
- [ ] Create game
- [ ] Get game
- [ ] Roll
- [ ] Hold
- [ ] Restart
- [ ] Protect endpoints
- [ ] Validate participant and turn
- [ ] Use an in-memory repository first
- [ ] Test API behavior independently from React

## Phase 12 — Simple playable React game

- [ ] Add game creation form
- [ ] Add player panels
- [ ] Add scores
- [ ] Add round score
- [ ] Add dice display
- [ ] Add Roll button
- [ ] Add Hold button
- [ ] Add New Game button
- [ ] Add API error handling
- [ ] Render server-provided permissions
- [ ] Do not calculate game rules in React

## Phase 13 — Persistent game state

- [ ] Replace the in-memory repository with MongoDB
- [ ] Preserve the repository interface
- [ ] Persist rolls, Hold actions, winner, and restart
- [ ] Resume an active game after backend restart
- [ ] Verify frontend API contract remains stable

## Phase 14 — Hardening and polish

- [ ] Add optimistic concurrency
- [ ] Prevent duplicate actions
- [ ] Add consistent API errors
- [ ] Add Swagger
- [ ] Add win counters
- [ ] Improve responsive layout
- [ ] Add accessibility
- [ ] Add reduced-motion support
- [ ] Add double-six feedback
- [ ] Add winner feedback
- [ ] Improve README and architecture documentation

## Phase 15 — Final delivery

- [ ] Run complete test suite
- [ ] Run complete build
- [ ] Run lint
- [ ] Verify fresh clone
- [ ] Verify local startup instructions
- [ ] Verify production deployment
- [ ] Verify GitHub repository
- [ ] Verify no secrets are committed
- [ ] Add screenshots
- [ ] Complete README
- [ ] Document known limitations
- [ ] Prepare interview walkthrough
