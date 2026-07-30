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

## Phase 1 — Project foundation

Status: Completed.

### Roadmap checklist

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

- [ ] Add `GET /api/health`
- [ ] Connect React to the backend
- [ ] Display loading, success, and error states
- [ ] Test the endpoint directly
- [ ] Test the frontend-to-backend flow
- [ ] Resolve local CORS or development-proxy configuration

## Phase 3 — MongoDB connection

- [ ] Add Mongoose
- [ ] Add environment configuration
- [ ] Add `.env.example`
- [ ] Connect NestJS to MongoDB
- [ ] Verify successful database connection
- [ ] Verify understandable failure behavior

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
