# Dice Game Interview Project — Decisions Log

_Last updated: 2026-07-31 13:35 (Israel time)_

This file records the decisions we have made so far. It should be updated whenever we approve a new architectural, technical, or gameplay decision.

## 1. Project goal

Build a full-stack two-player dice game for the interview assignment.

The final solution must include:

- A React frontend.
- A backend API with authentication.
- Backend-owned player identity, game state, game rules, turn validation, scoring, dice generation, and winner detection.
- A frontend that displays server state and sends actions such as Roll, Hold, and New Game.
- Two authenticated users simulated on the same page.

## 2. Development approach

We will build the project gradually in small, understandable vertical steps.

For every step:

1. Define one concrete goal.
2. Ask Claude Code to propose the commands and files first.
3. Review and approve before code changes.
4. Implement only the approved step.
5. Run the application manually.
6. Run automated tests and builds.
7. Review and understand the important code.
8. Commit the completed step to Git.
9. Continue only after the previous step works.

We will not ask AI to generate the entire application at once.

## 3. Approved technology direction

### Backend

- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT authentication later in the plan
- Jest and Supertest for backend testing

### Frontend

- React
- TypeScript
- Vite
- Simple `fetch` API client initially
- TanStack Query may be added when the game UI becomes more complex
- Vitest and React Testing Library for frontend testing

### Repository

Initial structure:

```text
dice-game-project/
├── api/
├── web/
├── README.md
└── .gitignore
```

We will keep the structure simple at the beginning. Shared packages, Docker, and additional infrastructure will be added only when justified.

## 4. Scope decisions

### Build now

- Backend and frontend foundations.
- API connection between React and NestJS.
- Automated tests after each working slice.
- MongoDB connection.
- A simple user creation flow stored in MongoDB.
- CI and an early deployment to prove the complete delivery flow.

### Build later

- Full authentication.
- Two authenticated user sessions on one page.
- Pure game engine.
- Game API.
- Playable React game screen.
- Persistent game state.
- Win counters, animation, accessibility, and polish.

### Do not add early

- Microservices
- RabbitMQ
- WebSockets
- AI opponent
- Sound effects
- Complex state-management libraries
- Premature shared-package architecture
- Large all-at-once generated implementation

## 5. Gameplay decisions already approved

These decisions will be implemented when we reach the game-engine phase:

1. The game has exactly two players.
2. A turn allows repeated rolls of two dice.
3. The sum of both dice is added to the current round score.
4. Only rolling 6 and 6 causes a bust.
5. A double six resets only the round score and passes the turn.
6. A single six has no special meaning.
7. Hold adds the round score to the active player’s global score.
8. Hold resets the round score and passes the turn.
9. A win is evaluated only after Hold.
10. The winning condition is `globalScore >= winningScore`.
11. The default winning score is 100.
12. The winning score is set when a game is created.
13. The winning score cannot be changed during an active game.
14. A participant may start a new game at any time.
15. Starting a new game ends or abandons the previous active game.
16. Lifetime win totals should survive between games once persistence is implemented.

## 6. Backend authority decisions

The backend will be the only authoritative source for:

- Dice values
- Current player
- Round score
- Global scores
- Turn changes
- Double-six detection
- Allowed actions
- Game status
- Winner detection

The client must never send trusted values for:

- `playerId`
- `userId`
- Dice results
- Scores
- Current player
- Winner
- Allowed actions

The acting player will eventually be derived from the authentication token.

## 7. Concrete implementation phases

### Phase 0 — Repository preparation

Goal: prepare a clean repository.

Actions:

- Add `.gitignore`.
- Add a basic `README.md`.
- Confirm the repository root.
- Confirm that secrets and `node_modules` are not tracked.

Suggested commit:

```text
docs: initialize project structure and roadmap
```

### Phase 1 — Create backend and frontend

Goal: create both applications and run them independently.

Actions:

- Create NestJS + TypeScript in `api/`.
- Create React + TypeScript + Vite in `web/`.
- Run each application.
- Run generated tests and builds.
- Review the important generated files.

Do not add MongoDB, authentication, or game logic.

Suggested commit:

```text
chore: initialize NestJS API and React application
```

### Phase 2 — Connect React to NestJS

Goal: prove the browser-to-backend flow works.

Backend endpoint:

```http
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "dice-game-api"
}
```

Frontend behavior:

- Call `/api/health`.
- Show loading state.
- Show success state.
- Show error state.

Tests:

- Test the API directly with `curl` or PowerShell.
- Test the health endpoint automatically.
- Build both projects.
- Verify there are no CORS or proxy errors.

Suggested commit:

```text
feat: connect React frontend to health API
```

### Phase 3 — Connect MongoDB

Goal: connect NestJS to MongoDB without adding user or game logic.

Actions:

- Add Mongoose integration.
- Add environment-based MongoDB configuration.
- Add `.env.example`.
- Keep `.env` ignored.
- Use local MongoDB, preferably with Docker Compose.
- Add database connectivity to the health check.

Tests:

- Start MongoDB and verify connection.
- Stop MongoDB and observe clear failure behavior.
- Restart MongoDB and verify recovery.

Suggested commit:

```text
feat: connect API to MongoDB
```

### Phase 4 — Create the first persistent user flow

Goal: prove a complete vertical flow:

```text
React form → NestJS API → validation → MongoDB → response → React display
```

Initial endpoints:

```http
POST /api/users
GET /api/users
GET /api/users/:id
```

Initial user fields:

- `id`
- `username`
- `createdAt`
- `updatedAt`

Authentication and passwords are not part of this phase.

Frontend:

- Username input.
- Create User button.
- Loading state.
- Error display.
- User list.

Tests:

- Create a valid user.
- Reject an empty or invalid username.
- Reject duplicate username.
- Confirm persistence after restarting the API.
- Confirm React displays the stored user.

Suggested commit:

```text
feat: add persistent user creation flow
```

### Phase 5 — Strengthen automated testing

Goal: establish reliable test structure before adding authentication and game rules.

Backend:

- Unit tests.
- Integration tests.
- API tests with Supertest.
- Separate test database.

Frontend:

- Form behavior.
- Loading state.
- Success state.
- Error state.

Suggested commit:

```text
test: add backend and frontend integration coverage
```

### Phase 6 — Add CI

Goal: validate every push automatically.

GitHub Actions should:

- Install dependencies.
- Run backend lint, tests, and build.
- Run frontend lint, tests, and build.
- Start MongoDB as a service when integration tests require it.

Approved implementation decisions:

- Run CI for pull requests and pushes to `main`.
- Use Node.js 22 and locked npm installs.
- Use a digest-pinned MongoDB 7.0.39 service for E2E tests.
- Keep the workflow token read-only and disable persisted checkout credentials.
- Pin actions to full commit SHAs.
- Block on backend production and frontend dependency audit findings at high
  severity, while retaining the documented backend development-tool findings.
- Run a separate full-history Gitleaks scan without comments or artifact
  uploads.
- Require no custom GitHub secrets for this phase.
- Ignore only the exact fingerprint of the verified public NestJS starter badge
  false positive.
- Keep normal lint read-only and expose auto-fixing only through `lint:fix`.

Suggested commit:

```text
ci: add test and build workflow
```

### Phase 7 — Deploy the basic flow

Goal: verify the full delivery pipeline before building the game.

Deploy:

- React frontend.
- NestJS backend.
- MongoDB Atlas.

Production test:

1. Open the hosted frontend.
2. Confirm it reaches the hosted API.
3. Create a user.
4. Confirm MongoDB stores the user.
5. Refresh and confirm the user remains available.

Suggested commit:

```text
chore: configure application deployment
```

### Phase 8 — Add real authentication

Goal: turn persistent users into authenticated users.

Endpoints:

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Requirements:

- Hash passwords.
- Never store or return plaintext passwords.
- Return JWT after successful login.
- Protect routes with JWT authentication.

Suggested commit:

```text
feat: add JWT user authentication
```

### Phase 9 — Support two authenticated users on one page

Goal: satisfy the interview requirement for two simulated players.

Frontend concept:

- Seat A session.
- Seat B session.
- Explicit “Acting as” selector.
- Each request uses the selected seat’s token.

The backend derives identity only from the JWT.

Suggested commit:

```text
feat: support two authenticated player sessions
```

### Phase 10 — Build the pure game engine

Goal: implement game rules independently of HTTP, MongoDB, Mongoose, NestJS controllers, and React.

Operations:

- `createGame()`
- `roll()`
- `hold()`
- `restart()`

Randomness must be injectable so tests can control dice values.

Tests must cover every approved gameplay rule and edge case.

Suggested commit:

```text
feat: implement tested game domain engine
```

### Phase 11 — Add an in-memory game API

Goal: connect authentication, controllers, application services, and the game engine before adding game persistence.

Endpoints:

```http
POST /api/games
GET /api/games/:id
POST /api/games/:id/roll
POST /api/games/:id/hold
POST /api/games/:id/restart
```

Use an in-memory repository temporarily.

Suggested commit:

```text
feat: expose authenticated in-memory game API
```

### Phase 12 — Build a simple playable React page

Goal: create a functional UI before advanced styling.

Display:

- Both players.
- Global scores.
- Round score.
- Current player.
- Two dice.
- Roll, Hold, and New Game controls.
- API errors.

React must only render server-provided state and permissions.

Suggested commit:

```text
feat: add playable React game interface
```

### Phase 13 — Persist game state in MongoDB

Goal: replace the in-memory game repository without changing the game engine or API contract.

Tests:

- Game survives API restart.
- Roll, Hold, win, and restart states persist.
- Frontend can resume an active game.

Suggested commit:

```text
feat: persist game state in MongoDB
```

### Phase 14 — Harden, polish, and finalize

Backend:

- Optimistic concurrency.
- Consistent error responses.
- Swagger/OpenAPI.
- Win counters.
- Logging and production health checks.

Frontend:

- Responsive design.
- Double-six animation.
- Winner display.
- Accessibility.
- Reduced-motion support.
- Better recovery from errors.

Delivery:

- Final CI.
- Final deployment.
- Fresh-clone verification.
- Complete README and architecture explanation.

## 8. Claude Code working rules

For each phase, Claude Code should:

1. Inspect the repository first.
2. Show proposed commands before running them.
3. Show files to create or modify.
4. Explain important dependencies before adding them.
5. Wait for approval before implementation when requested.
6. Implement only the current phase.
7. Avoid modifying unrelated files.
8. Run tests, lint, and builds.
9. Report exact results.
10. Stop and wait before continuing.

Recommended first instruction:

```text
We are building this project in small reviewed phases.
Read this decisions file first.
Work only on the phase I explicitly request.
Do not continue automatically to later phases.
Before editing, show the commands and files you propose to change.
```

## 9. Deferred decisions

The following decisions are intentionally postponed until the relevant phase:

- Exact production hosting providers.
- Whether to introduce npm workspaces.
- Whether to use TanStack Query immediately or after the first simple API calls.
- Authentication and JWT policy is approved in
  `docs/authentication-jwt-policy.md`; implementation remains scheduled for
  Phases 8 and 9.
- Detailed game API response shape.
- Optimistic concurrency implementation details.
- Final visual design.
- AI opponent.
- Sound effects.

## 10. Recommended order summary

This is the fixed high-level order for the project. We should not skip forward unless the current phase is working, tested, understood, and committed.

1. Prepare the repository.
2. Create the NestJS backend and React/Vite frontend.
3. Connect React to the backend through a health API.
4. Test the API directly and through the frontend.
5. Connect MongoDB.
6. Test MongoDB connectivity and failure behavior.
7. Create a persistent user flow from React to NestJS to MongoDB.
8. Test user creation, validation, duplicate prevention, and persistence.
9. Strengthen backend and frontend automated testing.
10. Add a GitHub Actions CI pipeline.
11. Deploy the basic frontend, API, and database flow.
12. Add registration, login, JWT authentication, and protected routes.
13. Support two authenticated user sessions on the same page.
14. Build the pure game engine with deterministic unit tests.
15. Expose the game engine through an authenticated in-memory API.
16. Build a simple playable React game page.
17. Replace in-memory game storage with MongoDB persistence.
18. Add concurrency protection, validation, error handling, win counters, and API documentation.
19. Polish the UI, accessibility, animations, and responsive design.
20. Complete final deployment, documentation, and fresh-clone verification.

### Progress checklist

- [ ] 1. Repository prepared
- [ ] 2. Backend and frontend created
- [ ] 3. Health API connection working
- [ ] 4. Initial connection tests passing
- [ ] 5. MongoDB connected
- [ ] 6. MongoDB tests passing
- [ ] 7. Persistent user flow working
- [ ] 8. User-flow tests passing
- [ ] 9. Test infrastructure strengthened
- [ ] 10. CI pipeline green
- [ ] 11. Basic application deployed
- [ ] 12. Authentication complete
- [ ] 13. Two-session simulation complete
- [ ] 14. Game engine complete and tested
- [ ] 15. Authenticated game API working
- [ ] 16. Playable React game working
- [ ] 17. Game state persisted in MongoDB
- [ ] 18. Application hardened
- [ ] 19. UI polished
- [ ] 20. Final delivery verified

## 11. Current next action

Review the locally verified Phase 6 changes. Commit and push only after
developer approval, then confirm both GitHub-hosted CI jobs pass before merge.
