# Current Phase

## Phase

Phase 11 - In-memory game API

## Status

Phase 10 was merged into `main` through pull request #11 as `0c68d23`.
Phase 11 is implemented, locally verified, and developer-approved on
`phase/11-in-memory-game-api`. Commit and push are authorized. It is not
deployed or merged.

## Implemented scope

- Added authenticated create, get, roll, hold, and restart game endpoints.
- Added an in-memory repository with UUID game IDs.
- Connected the Phase 10 game engine to NestJS without changing its rules.
- Derived the acting player only from the verified JWT `sub` claim.
- Required a distinct authenticated opponent and rejected legacy
  passwordless users.
- Enforced participant visibility, active-turn actions, and finished-game
  behavior.
- Generated dice only in the backend with `crypto.randomInt(1, 7)`.
- Returned caller-specific `allowedActions` and rejected authoritative action
  fields supplied by clients.
- Added deterministic service and real-MongoDB HTTP end-to-end coverage.

## Local verification

- Focused backend tests passed: 3 suites and 46 tests.
- Root lint passed for backend and frontend.
- Backend unit tests passed: 8 suites and 70 tests.
- MongoDB E2E tests passed: 4 suites and 42 tests.
- Frontend tests passed: 2 files and 14 tests.
- Backend and frontend builds passed; Vite transformed 22 modules.
- Backend production, backend full, and frontend audits found zero
  vulnerabilities.
- Full-history Gitleaks scanned 31 commits with no leaks.
- The working-tree Gitleaks scan found exactly the already verified public
  NestJS badge URL in `api/README.md` and no other finding. Its directory-scan
  fingerprint differs from the one exact historical fingerprint allowed in
  `.gitleaksignore`, which remains unchanged.

## Manual verification

- Started the built API against an isolated local MongoDB database.
- Registered and authenticated two temporary credentialed users.
- Created and retrieved a game from both participant perspectives.
- Confirmed a non-active participant received `409 NOT_YOUR_TURN`.
- Confirmed backend-generated dice stayed in the inclusive 1-6 range.
- Held with the current actor and restarted with the other participant.
- Confirmed restart reset scores, round state, dice, winner, and Player 1 turn.
- Dropped the temporary database, stopped the API, and removed temporary logs.

## Security boundary

- No dependency, environment variable, secret, database game collection, or
  frontend configuration was added.
- Every game endpoint requires the existing strict JWT guard.
- The backend ignores no caller-controlled identity: actor identity comes only
  from the verified access token.
- Unknown games and games hidden from nonparticipants both return the same 404
  response.
- Only credentialed users can be selected as opponents.
- Action request bodies must be empty; client-provided dice, scores, turns,
  winners, permissions, or player IDs are rejected.

## Out of scope

- React game UI or frontend game API integration
- MongoDB game persistence or recovery after API restart
- Optimistic concurrency and duplicate-action protection
- Lifetime win-counter updates
- Swagger/OpenAPI generation
- Production deployment or provider configuration
- Commit, push, pull request, merge, or Phase 12 implementation

## Next action

Complete the approved Phase 11 commit and push, then wait. Do not merge, deploy,
or begin Phase 12.
