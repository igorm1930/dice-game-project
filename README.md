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

Phase 2 connects React to the backend through `GET /api/health`. The frontend
shows loading, connected, and unavailable states based on the server response.

Use Node.js `20.19.x` or `22.12+`. The committed lockfiles use npm.

### Run the backend

```powershell
Set-Location api
npm.cmd ci
$env:FRONTEND_ORIGIN='http://localhost:5173'
npm.cmd run start:dev
```

The backend is available at `http://localhost:3000`. Its health endpoint is
`http://localhost:3000/api/health`.

### Run the frontend

```powershell
Set-Location web
npm.cmd ci
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

The frontend is available at `http://localhost:5173`.

`VITE_API_URL` is public frontend configuration. `FRONTEND_ORIGIN` is backend
operational configuration used for exact-origin CORS. Neither value is a
secret. Real `.env` files must not be committed.

### Verify Phase 2

```powershell
Set-Location api
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run test:e2e -- --runInBand
npm.cmd run build

Set-Location ../web
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run lint
npm.cmd run build
```

## Current status

Phase 2 is complete on `phase/02-api-connection`. Its reviewed implementation
is recorded in commit `53b5555`. The branch has not been merged into `main`,
and Phase 3 has not started. See `CURRENT_PHASE.md` and
`docs/session-log/002-api-connection.md` for the evidence and limitations.
