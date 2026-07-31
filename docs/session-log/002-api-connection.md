# Session 002 — Phase 2 API connection

## Status

Phase 2 implementation and verification were approved and completed on
`phase/02-api-connection`.

The reviewed implementation is committed in `53b5555`. No pull request or
merge has been created.

## Implemented

- Added `GET /api/health`.
- Added the global `/api` route prefix.
- Added explicit CORS approval for the configured frontend origin.
- Added required backend runtime configuration through `FRONTEND_ORIGIN`.
- Added public frontend configuration through `VITE_API_URL`.
- Added Vite startup and build validation for missing `VITE_API_URL`.
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
Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
npm.cmd run build # expected to fail clearly
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
- The frontend build without `VITE_API_URL` failed with the required clear
  configuration error.

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

Fresh-clone verification also confirmed:

- Node 24.18.1 and npm 11.16.0 satisfy the locked tool requirements.
- Lockfile installs completed without changing either lockfile.
- Backend lint, 2 unit suites/tests, 1 end-to-end suite with 2 tests, and the
  backend build passed.
- Frontend lint and configured build passed; Vite transformed 19 modules.
- Missing `VITE_API_URL` now fails the production build before creating a
  broken bundle.
- Missing `FRONTEND_ORIGIN` still fails backend startup clearly.
- Direct health and CORS checks passed on temporary API port 3001 because a
  pre-existing process owned port 3000.
- The frontend development server started on strict port 5173 and returned
  HTTP 200.
- Backend production, backend full, and frontend audits reported zero current
  vulnerabilities.
- Environment ignore checks and private-configuration scans passed.

The connected Codex browser surface was unavailable on the fresh-clone
computer, so the original checkpoint remains the browser-rendering evidence.
The React behavior files were unchanged between that browser verification and
the fresh-clone verification.

## Important local detail

Port 5173 was already owned by a pre-existing Node process. It was not stopped
or modified. The verified success flow therefore used a temporary frontend on
`http://127.0.0.1:5174` and a matching temporary `FRONTEND_ORIGIN`. The
temporary API and port-5174 frontend processes were stopped after verification.

## Review and Git status

- Developer review is approved.
- Checklist items are complete.
- Implementation commit: `53b5555 feat: complete Phase 2 API connection`.
- No pull request has been opened.
- Phase 3 has not started.

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
