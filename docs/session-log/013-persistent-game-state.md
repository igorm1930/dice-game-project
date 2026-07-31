# Phase 13 - Persistent game state

Date: 2026-07-31

Branch: `phase/13-persistent-game-state`

Base: Phase 12 merged into `main` as `badca27`

## Scope

Replaced the production in-memory game repository with MongoDB without changing
the game engine, authentication boundary, endpoints, response bodies, or
frontend game-client contract.

## Implementation

- Added a validated `games` schema using UUID v4 strings as MongoDB `_id`
  values.
- Persisted players and scores, active-player index, round score, target, last
  roll, status, winner, and timestamps in one document.
- Added a Mongoose repository behind the existing `GameRepository` boundary.
- Converted repository, service, and controller methods to asynchronous
  operations.
- Kept the in-memory repository only for isolated service unit tests.
- Retained all authorization and caller-specific permission logic in
  `GameService`.
- Updated the frontend missing-game message to remove obsolete in-memory
  wording.

## Automated verification

- Focused repository/service tests: 2 suites, 14 tests passed.
- Focused real-MongoDB game E2E: 1 suite, 12 tests passed.
- Focused frontend App tests: 1 file, 14 tests passed.
- Root verification:
  - backend lint passed
  - frontend lint passed
  - backend unit tests: 9 suites, 75 tests passed
  - backend E2E tests: 4 suites, 42 tests passed
  - frontend tests: 4 files, 36 tests passed
  - backend build passed
  - frontend build passed with Vite 8.1.5 and 24 transformed modules
- Backend production audit: zero vulnerabilities.
- Frontend full audit: zero vulnerabilities.
- Backend development-tool audit: the unchanged 25 high findings through
  `brace-expansion` and `minimatch`; only breaking forced fixes were offered.
- Full-history Gitleaks: 33 commits scanned with no leaks.
- Focused game-source and documentation Gitleaks scans: no leaks.

## Persistence coverage

The real-MongoDB game suite closes and recreates the complete Nest application
after each important state:

- Roll and current round score
- Hold and changed turn
- double-six bust
- victory
- Restart

Each new application retrieves the same UUID game and verifies the exact
stored state and caller-specific permissions.

## Manual verification

The built API and Vite frontend ran against an isolated
`dice_game_phase13_manual` database.

Verified:

- two independent authenticated seats
- target-20 game creation
- a 2-and-4 Roll stored as round score 6
- exact state recovery after replacing the API process
- participant-specific permissions after recovery
- continued play with Hold, banking 6 points
- game Restart
- exact reset-state recovery after a second API-process replacement

Browser logs contained no application warnings or errors. Observed warnings
came from an unrelated extension. Temporary processes were stopped, the
isolated database was dropped and confirmed absent, logs contained no
sensitive-value patterns, and all temporary logs were removed.

## Security review

- Game documents contain no access tokens, password hashes, credentials, or
  client-provided actor identity.
- Existing JWT verification and participant authorization occur before game
  lookup or mutation.
- Missing and hidden games share the existing safe 404 response.
- Schema validators constrain UUID and participant IDs, exactly two distinct
  players, safe scores, dice, status, and winner consistency.
- Every action updates one MongoDB document.
- No new dependency, environment variable, endpoint, cookie, browser storage,
  raw HTML, or client game rule was added.

## Deferred

- optimistic concurrency and duplicate-action protection
- lifetime win updates
- old-game retention and cleanup
- game discovery and resume after a full browser refresh
- Swagger/OpenAPI
- production deployment
- Phase 14 hardening and polish

## Git

The Phase 13 work was reviewed and approved for commit and push. Phase 14 has
not started.
