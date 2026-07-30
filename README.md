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

Phase 1 created two independent applications:

- `api/` — NestJS and TypeScript backend
- `web/` — React, TypeScript, and Vite frontend

They are intentionally not connected yet. The backend currently exposes only
the generated `GET /` route, and the frontend displays only the generated Vite
starter page.

### Run the backend

```powershell
Set-Location api
npm install
npm run start:dev
```

The generated backend is available at `http://localhost:3000`.

### Run the frontend

```powershell
Set-Location web
npm install
npm run dev
```

Vite prints the local development URL when it starts.

### Verify Phase 1

```powershell
Set-Location api
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build

Set-Location ../web
npm run lint
npm run build
```

## Current status

Phase 1 is complete on the `phase-1-foundation` branch. Phase 2 has not
started. See `CURRENT_PHASE.md` for the verification record.
