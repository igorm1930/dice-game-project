# Session 002 — Phase 2 API connection checkpoint

## Status

Phase 2 is in progress on `phase/02-api-connection`.

This checkpoint preserves verified implementation work so development can
continue on another computer. Phase 2 has not been marked complete, and no
pull request has been created.

## Implemented

- Added `GET /api/health`.
- Added the global `/api` route prefix.
- Added explicit CORS approval for the configured frontend origin.
- Added required backend runtime configuration through `FRONTEND_ORIGIN`.
- Added public frontend configuration through `VITE_API_URL`.
- Added placeholder-only `api/.env.example` and `web/.env.example` files.
- Added a typed frontend health client with response validation.
- Replaced the generated React starter screen with loading, success, and error
  states.
- Added an `AbortController` cleanup for React Strict Mode.
- Added health-controller unit coverage and health-endpoint end-to-end
  coverage.
- Marked Phase 2 as in progress in `CURRENT_PHASE.md`.

No dependencies, secrets, database code, authentication, or game logic were
added.

## Verification completed

The following commands passed against the final checkpoint:

```powershell
cd api
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run test:e2e -- --runInBand
npm.cmd run build

cd ../web
npm.cmd run lint
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run build
```

Exact automated results:

- Backend lint: passed.
- Backend unit tests: 2 suites and 2 tests passed.
- Backend end-to-end tests: 1 suite and 2 tests passed.
- Backend build: passed.
- Frontend lint: passed.
- Frontend build: passed.

Runtime verification completed:

- Missing `FRONTEND_ORIGIN` caused the built backend to exit with code 1 and
  `FRONTEND_ORIGIN environment variable is required`.
- `GET /api/health` returned HTTP 200 and
  `{"status":"ok","service":"dice-game-api"}`.
- The configured frontend origin received the matching
  `Access-Control-Allow-Origin` header.
- A different origin did not receive an `Access-Control-Allow-Origin` header.
- The frontend loading state displayed `Checking the backend…`.
- The successful browser flow displayed `Backend connected` and
  `dice-game-api reported ok.`
- With the backend unavailable, the frontend displayed `Backend unavailable`
  and `Failed to fetch`.
- Missing `VITE_API_URL` produced the understandable browser runtime error
  `VITE_API_URL environment variable is required`.

## Important local detail

Port 5173 was already owned by a pre-existing Node process. It was not stopped
or modified. The verified success flow therefore used a temporary frontend on
`http://127.0.0.1:5174` and a matching temporary `FRONTEND_ORIGIN`. The
temporary API and port-5174 frontend processes were stopped after verification.

## Remaining Phase 2 work

- Decide whether missing `VITE_API_URL` must fail the production build itself.
  The current implementation fails clearly when the application runs, while
  Vite still completes its build without that variable.
- Review the implementation and interview explanation.
- Update the approved Phase 2 documentation and checklist only after review.
- Run final status and security checks.
- Mark Phase 2 complete only after approval.
- Open a pull request only when explicitly requested.

## Resume commands

```powershell
git fetch origin
git switch phase/02-api-connection
git pull --ff-only
```

Use runtime environment variables rather than creating real `.env` files:

```powershell
cd api
$env:FRONTEND_ORIGIN='http://localhost:5173'
npm.cmd run start:dev
```

In a second terminal:

```powershell
cd web
$env:VITE_API_URL='http://localhost:3000'
npm.cmd run dev
```
