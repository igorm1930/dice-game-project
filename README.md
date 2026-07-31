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
full-history secret scanning. Phase 7 prepares a Render and MongoDB Atlas
deployment without committing production credentials.

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
npm.cmd run start:dev
```

The backend is available at `http://localhost:3000`. Its health endpoint is
`http://localhost:3000/api/health`. User endpoints are available under
`http://localhost:3000/api/users`.

### Run the frontend

```powershell
Set-Location web
npm.cmd ci
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

The frontend is available at `http://localhost:5173`.

`VITE_API_URL` is public frontend configuration. `NODE_ENV`, `PORT`,
`FRONTEND_ORIGIN`, and `MONGODB_URI` are backend runtime configuration.
`MONGODB_URI` is private backend configuration and must never use the `VITE_`
prefix. Real `.env` files must not be committed.

The project MongoDB service is bound only to `127.0.0.1:27018`. It intentionally
does not use the already-occupied port 27017.

### Verify Phase 6 locally

```powershell
docker compose up -d mongodb
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run verify
Remove-Item Env:VITE_API_URL
```

The E2E suite defaults to `dice_game_e2e`, runs serially, cleans the user
collection, and rejects database names that do not end in `_test` or `_e2e`.

CI repeats locked installs, production dependency audits, the root verification
command, and MongoDB-backed E2E tests on Node.js 22. A separate Gitleaks job
scans full Git history. The workflow uses read-only permissions and does not
require custom repository secrets.

### Deployment configuration

`render.yaml` defines the planned free Render API and static-site services in
Frankfurt. The target URLs are:

- `https://dice-game-api-igorm1930.onrender.com`
- `https://dice-game-web-igorm1930.onrender.com`

These services are not live yet. MongoDB Atlas M0 provisioning and all provider
changes require separate approval. `MONGODB_URI` must be entered directly as
a Render secret, and Atlas must allow only Render's current Frankfurt outbound
IP ranges. See `docs/deployment.md` for the approved sequence and checks.

## Current status

Phases 1 through 6 are merged into `main`. Phase 7's local configuration is
implemented and verified on `phase/07-initial-deployment-flow`. External
services have not been provisioned, and the Phase 7 changes are not committed
or pushed. See `CURRENT_PHASE.md`, `docs/deployment.md`, and the session logs
for verification evidence.
