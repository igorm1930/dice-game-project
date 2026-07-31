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

- [ ] Create the first user schema
- [ ] Create a user-creation endpoint
- [ ] Create a simple React user form
- [ ] Store users in MongoDB
- [ ] Display created users
- [ ] Verify persistence after backend restart

## Phase 5 — Automated testing foundation

- [ ] Add backend unit-test structure
- [ ] Add backend integration-test structure
- [ ] Add frontend component tests
- [ ] Use a separate test database
- [ ] Add root-level test and build commands when appropriate

## Phase 6 — Continuous integration

- [ ] Add GitHub Actions
- [ ] Configure CI secrets and least-privilege workflow permissions
- [ ] Add dependency and secret scans
- [ ] Install dependencies
- [ ] Run lint
- [ ] Run tests
- [ ] Build backend
- [ ] Build frontend
- [ ] Add MongoDB service when integration tests require it

## Phase 7 — Initial deployment flow

- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Connect production MongoDB
- [ ] Configure environment variables
- [ ] Verify health endpoint
- [ ] Verify persistent user flow in production
- [ ] Confirm CI still passes

## Phase 8 — Authentication

- [ ] Add and validate authentication secrets
- [ ] Run a security review of authentication and authorization controls
- [ ] Add password hashing
- [ ] Add registration
- [ ] Add login
- [ ] Add JWT generation and validation
- [ ] Add protected routes
- [ ] Add current-user endpoint
- [ ] Test invalid, missing, and valid credentials

## Phase 9 — Two authenticated users on one page

- [ ] Add Seat A session
- [ ] Add Seat B session
- [ ] Add active acting-user selector
- [ ] Select JWT per request
- [ ] Verify both identities remain independent
- [ ] Verify backend identity comes from the token

## Phase 10 — Pure backend game engine

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
