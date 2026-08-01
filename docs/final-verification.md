# Final Verification

Date: 2026-08-01

Branch: `phase/15-final-delivery`

Base: `main` at `2ddf8df20bf8fc7b1ec63dc8aac76519ef529ec2`

## Scope

This phase verifies and packages the existing application. It changes no
dependency, application source, runtime configuration, schema, authentication
behavior, game rule, or provider setting.

## Fresh clone

A new single-branch clone of `main` was created at
`C:\tmp\dice-game-phase15-fresh`. The approved MongoDB service was already
running from `compose.yaml`.

```powershell
npm.cmd ci                         # api
npm.cmd ci                         # web
$env:VITE_API_URL='http://127.0.0.1:3000'
npm.cmd run verify                 # repository root
docker compose config
```

Results:

- API install: 750 packages, zero vulnerabilities reported.
- Web install: 125 packages, zero vulnerabilities reported.
- API lint and web lint passed.
- Backend unit tests: 12 suites, 95 tests passed.
- Frontend tests: 4 files, 40 tests passed.
- MongoDB E2E tests: 4 suites, 47 tests passed.
- API and web builds passed.
- Vite 8.1.5 transformed 24 modules.
- Compose resolved MongoDB 7.0.39 on `127.0.0.1:27018` with its health check.

The fresh-clone verification used the host's Node.js 24 installation. The same
source is also verified by GitHub Actions on the supported Node.js 22 line.

## Configuration failure checks

- Building the web app without `VITE_API_URL` exited nonzero with
  `VITE_API_URL environment variable is required`.
- Starting the API without `FRONTEND_ORIGIN` exited nonzero with
  `FRONTEND_ORIGIN environment variable is required`.

These failures prevent an incorrectly configured browser-to-API deployment.

## Dependency and secret checks

```powershell
npm.cmd audit --omit=dev --audit-level=high  # api
npm.cmd audit --audit-level=high             # api
npm.cmd audit --audit-level=high             # web
npm.cmd ls @nestjs/swagger js-yaml           # api
```

All three audits found zero vulnerabilities. `@nestjs/swagger@11.4.6` resolves
its narrowly overridden `js-yaml` to `5.2.2`.

Gitleaks 8.30.1 results:

- Full Git history: 36 commits, approximately 1.08 MB, no leaks.
- `api/src`: no leaks.
- `web/src`: no leaks.
- `docs`: no leaks before the final documentation update; repeated after the
  update during final cleanup.

The existing `.gitleaksignore` remains limited to the previously reviewed exact
public NestJS badge fingerprint.

## Local runtime and browser

The local flow used:

- API from the fresh clone
- Vite from the fresh clone
- `dice_game_phase15_manual`
- temporary non-sensitive users `phase15_alice_0801` and
  `phase15_bob_0801`

Ports 3000 and 3001 were already occupied by unrelated local processes. The
isolated API therefore used free port 3015; Vite used 5173. No unrelated
process was stopped.

Verified:

- health, liveness, and readiness returned HTTP 200
- both users registered and signed in independently
- acting identity came from the selected bearer token
- target-1 game creation, Roll, Hold, winner, and lifetime-win update worked
- desktop setup and in-progress states rendered correctly
- 768px tablet and 390px mobile layouts had readable single-column content
- controls activated by keyboard
- browser logs contained no application errors or warnings

Warnings were extension-origin EventEmitter/ObjectMultiplex messages unrelated
to the application. Normal Vite and React development messages were also
present.

## Screenshots

- `docs/screenshots/01-game-setup-desktop.png` - 1718 x 1539
- `docs/screenshots/02-game-in-progress-desktop.png` - 1703 x 1866
- `docs/screenshots/03-winner-mobile.png` - 390 x 844

The screenshots contain only public UI state and temporary usernames. They
contain no passwords, tokens, secrets, connection strings, or provider
environment values.

## GitHub verification

- Repository: `igorm1930/dice-game-project`
- Default branch: `main`
- Remote `main`: `2ddf8df20bf8fc7b1ec63dc8aac76519ef529ec2`
- Pull request #15: merged as Phase 14
- Latest `main` CI run `30688333674`: successful on `2ddf8df`

No GitHub state was changed.

## Production verification

Read-only requests returned:

| Surface | Result |
| --- | --- |
| `/api/health` | HTTP 200, JSON |
| `/api/health/live` | HTTP 200, JSON |
| `/api/health/ready` | HTTP 200, JSON |
| `/api/openapi.json` | HTTP 200, JSON |
| `/api/docs` | HTTP 200, Swagger HTML |
| hosted frontend | HTTP 200, HTML and connected UI |

The exact frontend origin received
`access-control-allow-origin: https://dice-game-web-igorm1930.onrender.com`.
An unapproved origin received no allow-origin header; its preflight received no
CORS permission.

The Render dashboard showed both `dice-game-api-igorm1930` and
`dice-game-web-igorm1930` deployed and live on Phase 14 commit `1a7407d`.
The hosted UI connected to the API, and Swagger exposed authentication, users,
games, health, schemas, and bearer authorization. No production user or game
was created.

## Cleanup

Final cleanup stopped only the identified fresh-clone Node processes. The
temporary logs had zero sensitive-pattern matches before deletion. The exact
logs and browser capture intermediates were removed,
`dice_game_phase15_manual` was dropped and confirmed absent, the approved
fresh-clone directory was verified and removed, and all browser tabs were
finalized.

## Remaining unverified

- Phase 15 has not yet been reviewed, committed, pushed, merged, or deployed.
- No destructive production cleanup, production account/game flow, paid-tier
  behavior, load test, penetration test, or long-duration soak test was run.
- Provider secrets were intentionally not opened or inspected.
