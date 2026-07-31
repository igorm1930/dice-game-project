# Current Phase

## Phase

Phase 13 - Persistent game state

## Status

Phase 12 was merged into `main` through pull request #13 as `badca27`.
Phase 13 is implemented, locally verified, and developer-reviewed on
`phase/13-persistent-game-state`. Commit and push are authorized. It is not
deployed or merged.

## Implemented scope

- Added a validated MongoDB `games` schema with UUID IDs and the complete
  authoritative game state.
- Added a Mongoose repository behind the existing `GameRepository` interface.
- Converted repository, service, and controller operations to asynchronous
  persistence without changing endpoints or response bodies.
- Kept the in-memory repository only for isolated service unit tests.
- Persisted create, Roll, Hold, double-six, win, and Restart state.
- Added repository unit coverage and real-MongoDB API-restart coverage.
- Removed obsolete in-memory wording from the frontend missing-game message.

## Local verification

- Focused repository and service tests passed: 2 suites and 14 tests.
- Focused game API E2E tests passed: 1 suite and 12 tests.
- Focused frontend App tests passed: 1 file and 14 tests.
- Root verification passed backend and frontend lint.
- Backend unit tests passed: 9 suites and 75 tests.
- MongoDB E2E tests passed: 4 suites and 42 tests.
- Frontend tests passed: 4 files and 36 tests.
- Backend and frontend builds passed; Vite transformed 24 modules.
- Backend production and frontend audits found zero vulnerabilities.
- The unchanged backend development-tool audit reported the previously
  documented 25 high findings through `brace-expansion` and `minimatch`;
  npm's complete fix requires breaking forced upgrades.
- Full-history Gitleaks scanned 33 commits with no leaks.
- Focused game-source and documentation scans found no leaks.

## Manual verification

- Started the built API and Vite frontend against an isolated local database.
- Registered and signed in two temporary players and created a target-20 game.
- Rolled 2 and 4 for a round score of 6, then stopped and restarted the API.
- Switched acting seats after restart and recovered the exact score, dice,
  turn, target, players, and caller-specific permissions.
- Continued the recovered game with Hold and confirmed Player 1's score became
  6.
- Restarted the game, restarted the API again, and recovered the fully reset
  state.
- Browser logs contained no application warnings or errors; observed warnings
  came from an unrelated extension.
- Dropped the isolated database, stopped temporary processes, and removed
  temporary logs after checking them for sensitive values.

## Security boundary

- No dependency, environment variable, endpoint, browser storage, cookie, or
  client identity field was added.
- Game documents contain only UUIDs, participant IDs, scores, dice, turn,
  target, status, winner, and timestamps; never tokens or password data.
- Existing strict JWT and participant authorization still execute before
  repository access.
- Schema validation constrains IDs, exactly two distinct players, safe scores,
  dice, status, and winner consistency.
- Missing and hidden games retain the same `GAME_NOT_FOUND` response.
- Each action writes one MongoDB document; optimistic concurrency remains
  intentionally deferred.

## Out of scope

- Backend endpoint, game engine, authentication, or authorization changes
- Optimistic concurrency and duplicate-action protection
- Game discovery or resume after a full browser refresh
- Retention, archival, or deletion of old game documents
- Lifetime win-counter updates
- Swagger/OpenAPI generation
- Production deployment or provider configuration
- UI animation, reduced-motion polish, and Phase 14 refinements
- Commit, push, pull request, merge, or Phase 14 implementation

## Next action

Create and push the approved Phase 13 commit, then wait. Do not deploy, merge,
or begin Phase 14 without explicit approval.
