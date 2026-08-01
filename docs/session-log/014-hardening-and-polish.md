# Phase 14 - Hardening and polish

Date: 2026-08-01

Branch: `phase/14-hardening-and-polish`

Base: Phases 1 through 13 merged into `main` as `93e188b`

## Scope

Hardened concurrent game mutations and API behavior, added idempotent lifetime
win counters and OpenAPI documentation, and polished the playable frontend's
feedback, accessibility, animation, and responsive layout.

## Implementation

- Added non-negative game versions, matching strong ETags, required strong
  `If-Match` mutation preconditions, atomic version updates, and normalized
  `GAME_STATE_CONFLICT` responses.
- Added frontend stale-state recovery that refetches authoritative game state.
- Added hidden counted-game IDs and atomic, idempotent lifetime win updates,
  with participant-read repair after an interrupted post-win update.
- Added a global normalized exception filter and metadata-only request logging.
- Added liveness and readiness routes while retaining `/api/health`
  compatibility.
- Added Swagger UI and OpenAPI JSON with documented DTOs, responses, and bearer
  authorization.
- Added lifetime wins, double-six and winner status, busy/current-state
  accessibility, responsive layouts, touch targets, focus styles, animation,
  and reduced-motion behavior.
- Added `@nestjs/swagger` and narrowly pinned its transitive `js-yaml` to the
  patched `5.2.2` release.

## Automated verification

- Focused backend tests: 7 suites, 44 tests passed.
- Backend unit tests: 12 suites, 95 tests passed.
- MongoDB E2E tests: 4 suites, 47 tests passed.
- Frontend tests: 4 files, 40 tests passed.
- Backend and frontend lint passed.
- Backend and configured frontend builds passed.
- Vite 8.1.5 transformed 24 modules.
- The unconfigured frontend build failed with the intended
  `VITE_API_URL environment variable is required` message.
- Backend production, backend full, and frontend audits found zero
  vulnerabilities.
- Full-history and focused backend, frontend, and documentation Gitleaks scans
  found no leaks.

## Manual verification

The built API and Vite frontend ran against the isolated
`dice_game_phase14_manual` database.

Verified:

- two account registrations and independent authenticated seats
- creation of a target-1 game
- a 1-and-4 roll followed by Hold and victory
- winner banner and lifetime wins changing from zero to one
- Restart resetting game state while preserving the lifetime win
- readable desktop, 768px, and 390px layouts without visible overflow
- Swagger tags, operations, schemas, health routes, and authorization control
- metadata-only runtime logs using `/api/games/:id/...` route templates

Browser logs had no application warning or error. Warnings came from an
unrelated extension. The isolated database was dropped and confirmed absent,
the temporary processes were stopped, and temporary logs were removed after a
sensitive-pattern check.

## Security review

- Versions and ETags are public concurrency metadata, not authorization.
- JWT verification and participant authorization still precede game access.
- Counted win game IDs are hidden from public user responses.
- Unexpected exception details are neither returned nor logged.
- Request logs omit request bodies, headers, query strings, tokens, user IDs,
  and game IDs.
- No environment variable, secret, cookie, browser storage, raw HTML, or
  client-side game rule was added.
- All dependency and secret scans passed.

## Production deployment

- Pull request #15 passed Verify and Secret scan, then merged into `main` as
  `1a7407d`.
- Post-merge `main` CI passed Verify in 1 minute 12 seconds and Secret scan in
  8 seconds.
- Render reported both `dice-game-api-igorm1930` and
  `dice-game-web-igorm1930` live on `1a7407d`.
- Production liveness and readiness returned HTTP 200.
- Swagger UI and OpenAPI JSON exposed the Phase 14 routes and contracts.
- The hosted frontend connected successfully, and deployed assets included
  conflict recovery, lifetime wins, `If-Match`, reduced-motion, and winner
  feedback.
- Exact-origin CORS passed; an unapproved origin received no CORS permission.
- Provider logs showed successful startup and metadata-only requests without
  errors or sensitive values.
- No production demonstration data was created.

## Deferred

- further production-provider configuration changes
- commit, push, pull request, and merge
- fresh-clone verification and production regression
- screenshots and interview walkthrough
- game discovery and browser-session persistence after refresh
- retention, archival, and deletion of old games
- Phase 15 final delivery

## Git

Phase 14 is implemented, locally verified, developer-reviewed, merged through
pull request #15 as `1a7407d`, and deployed on the approved Render services.
