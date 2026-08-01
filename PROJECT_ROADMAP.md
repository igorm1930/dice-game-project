# Project Roadmap

## Working rule

Complete, test, review, and commit each phase before starting the next one.

Do not skip phases without documenting the reason.

## Phase 1 — Project foundation

- Create a root `.gitignore`
- Create the project security policy
- Create NestJS backend in `api/`
- Create React, TypeScript, and Vite frontend in `web/`
- Run both applications independently
- Understand important generated files
- Run generated tests and builds

## Phase 2 — API connection

- Add `GET /api/health`
- Add public frontend API URL configuration with `VITE_API_URL`
- Add backend frontend-origin configuration
- Document the public configuration values
- Connect React to the backend
- Display loading, success, and error states
- Test the endpoint directly
- Test the frontend-to-backend flow
- Resolve local CORS or development-proxy configuration

## Phase 3 — MongoDB connection

- Add Mongoose
- Add private MongoDB environment configuration
- Add typed NestJS configuration validation
- Add `.env.example`
- Connect NestJS to MongoDB
- Verify successful database connection
- Verify understandable failure behavior

## Phase 4 — Persistent user flow

- Create the first user schema
- Create a user-creation endpoint
- Create a simple React user form
- Store users in MongoDB
- Display created users
- Verify persistence after backend restart

## Phase 5 — Automated testing foundation

- Add backend unit-test structure
- Add backend integration-test structure
- Add frontend component tests
- Use a separate test database
- Add root-level test and build commands when appropriate

## Phase 6 — Continuous integration

- Add GitHub Actions
- Configure CI secrets and least-privilege workflow permissions
- Add dependency and secret scans
- Install dependencies
- Run lint
- Run tests
- Build backend
- Build frontend
- Add MongoDB service when integration tests require it

## Phase 7 — Initial deployment flow

- Deploy frontend
- Deploy backend
- Connect production MongoDB
- Configure environment variables
- Verify health endpoint
- Verify persistent user flow in production
- Confirm CI still passes

## Phase 8 — Authentication

- Add and validate authentication secrets
- Run a security review of authentication and authorization controls
- Add password hashing
- Add registration
- Add login
- Add JWT generation and validation
- Add protected routes
- Add current-user endpoint
- Test invalid, missing, and valid credentials

## Phase 9 — Two authenticated users on one page

- Add Seat A session
- Add Seat B session
- Add active acting-user selector
- Select JWT per request
- Verify both identities remain independent
- Verify backend identity comes from the token

## Phase 10 — Pure backend game engine

- Define game state
- Implement game creation
- Implement roll
- Implement Hold
- Implement turn switching
- Implement double-six behavior
- Implement winner detection
- Inject deterministic dice roller
- Add complete game-rule unit tests
- Keep engine independent of HTTP and MongoDB

## Phase 11 — In-memory game API

- Add game endpoints
- Create game
- Get game
- Roll
- Hold
- Restart
- Protect endpoints
- Validate participant and turn
- Use an in-memory repository first
- Test API behavior independently from React

## Phase 12 — Simple playable React game

- Add game creation form
- Add player panels
- Add scores
- Add round score
- Add dice display
- Add Roll button
- Add Hold button
- Add New Game button
- Add API error handling
- Render server-provided permissions
- Do not calculate game rules in React

## Phase 13 — Persistent game state

- Replace the in-memory repository with MongoDB
- Preserve the repository interface
- Persist rolls, Hold actions, winner, and restart
- Resume an active game after backend restart
- Verify frontend API contract remains stable

## Phase 14 — Hardening and polish

- Add optimistic concurrency
- Prevent duplicate actions
- Add consistent API errors
- Add Swagger
- Add win counters
- Improve responsive layout
- Add accessibility
- Add reduced-motion support
- Add double-six feedback
- Add winner feedback
- Improve README and architecture documentation

## Phase 15 — Final delivery

- Run complete test suite
- Run complete build
- Run lint
- Verify fresh clone
- Verify local startup instructions
- Verify production deployment
- Verify GitHub repository
- Verify no secrets are committed
- Add screenshots
- Complete README
- Document known limitations
- Prepare interview walkthrough

## Phase 16 - Versioned game rules and turn handoff fix

- Reproduce the double-six UI handoff defect against merged `main`
- Introduce a backend `GameRules` policy with semantic roll outcomes
- Keep only `double-six-v1` active in production
- Persist each game's stable rule-set ID with explicit legacy handling
- Expose semantic game events and remove React dice-rule inference
- Preserve backend ownership of caller permissions
- Select the authenticated seat matching the server's new active player
- Refetch the same game with the new active player's bearer token
- Add complete deterministic API and rendered-UI regression coverage
- Complete the assignment-rule traceability audit
- Run full verification, security scans, and two-user browser validation
