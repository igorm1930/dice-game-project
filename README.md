# Dice Game Interview Project

A full-stack two-player dice game created as an interview assignment.

## Planned stack

### Backend

- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT authentication

### Frontend

- React
- TypeScript
- Vite

## Development approach

The project is built incrementally.

Each phase must be:

1. Planned
2. Approved
3. Implemented
4. Tested
5. Reviewed
6. Committed

The application is not built in one large AI-generated step.

## Project documentation

- `AGENTS.md` — instructions for AI coding agents
- `CLAUDE.md` — Claude Code entry instructions
- `PROJECT_DECISIONS.md` — approved technical and product decisions
- `PROJECT_ROADMAP.md` — ordered implementation phases
- `CURRENT_PHASE.md` — the only phase currently allowed
- `docs/assignment-requirements.md` — assignment requirements
- `docs/architecture.md` — implemented architecture
- `docs/api-contracts.md` — implemented API contracts
- `docs/testing-strategy.md` — actual testing strategy
- `docs/session-log/` — completed-session records

## Applications

The repository contains two applications:

- `api/` — NestJS and TypeScript backend
- `web/` — React, TypeScript, and Vite frontend

Phase 2 connects React to the backend through `GET /api/health`. Phase 3 adds
validated MongoDB configuration and requires a live database connection before
the health endpoint reports success. Phase 4 adds validated persistent users,
user API endpoints, and the React creation/list flow. Phase 5 adds backend test
structure, database safety, frontend component tests, and root verification
commands. Phase 6 adds read-only, SHA-pinned GitHub Actions verification and
full-history secret scanning. Phase 7 deploys the basic flow. Phase 8 adds
Argon2id password hashing, rate-limited registration and login, HS256 bearer
tokens, and a protected current-user endpoint.

Use Node.js `20.19.x` or `22.12+`. The committed lockfiles use npm.

### Run the backend

```powershell
docker compose up -d mongodb

Set-Location api
npm.cmd ci
$env:NODE_ENV='development'
$env:PORT='3000'
$env:FRONTEND_ORIGIN='http://localhost:5173'
$env:MONGODB_URI='mongodb://127.0.0.1:27018/dice_game'
$diceGameJwtBytes=New-Object byte[] 32
$diceGameJwtRng=[Security.Cryptography.RandomNumberGenerator]::Create()
$diceGameJwtRng.GetBytes($diceGameJwtBytes)
$diceGameJwtRng.Dispose()
$env:JWT_SECRET=[Convert]::ToBase64String($diceGameJwtBytes)
$env:JWT_EXPIRES_IN='30m'
$env:JWT_ISSUER='dice-game-api'
$env:JWT_AUDIENCE='dice-game-web'
npm.cmd run start:dev
```

The backend is available at `http://localhost:3000`. Its health endpoint is
`http://localhost:3000/api/health`. User endpoints are available under
`http://localhost:3000/api/users`. Authentication endpoints are under
`http://localhost:3000/api/auth`.

### Run the frontend

```powershell
Set-Location web
npm.cmd ci
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

The frontend is available at `http://localhost:5173`.

`VITE_API_URL` is public frontend configuration. `NODE_ENV`, `PORT`,
`FRONTEND_ORIGIN`, `MONGODB_URI`, and all `JWT_*` values are backend runtime
configuration. `MONGODB_URI` and `JWT_SECRET` are private backend configuration
and must never use the `VITE_` prefix. Real `.env` files must not be committed.

The project MongoDB service is bound only to `127.0.0.1:27018`. It intentionally
does not use the already-occupied port 27017.

### Verify Phase 6 locally

```powershell
docker compose up -d mongodb
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run verify
Remove-Item Env:VITE_API_URL
```

The E2E suite defaults to `dice_game_e2e`, generates an ephemeral test JWT
secret, runs serially, cleans the user collection, and rejects database names
that do not end in `_test` or `_e2e`.

CI repeats locked installs, production dependency audits, the root verification
command, and MongoDB-backed E2E tests on Node.js 22. A separate Gitleaks job
scans full Git history. The workflow uses read-only permissions and does not
require custom repository secrets.

### Deployment configuration

`render.yaml` defines the planned free Render API and static-site services in
Frankfurt. The target URLs are:

- `https://dice-game-api-igorm1930.onrender.com`
- `https://dice-game-web-igorm1930.onrender.com`

These services are live. Provider changes still require separate approval.
`MONGODB_URI` and `JWT_SECRET` must be entered directly as Render secrets, and
Atlas must allow only Render's current Frankfurt outbound IP ranges. See
`docs/deployment.md` for the approved sequence and checks.

## Current status

Phases 1 through 7 are merged into `main`. Phase 8 backend authentication is
implemented, locally verified, and developer-approved on
`phase/08-authentication`. No Phase 8 provider change, commit, or push has been
performed.
