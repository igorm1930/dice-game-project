# Current Phase

## Phase

Phase 12 - Simple playable React game

## Status

Phase 11 was merged into `main` through pull request #12 as `28db4f1`.
Phase 12 is implemented, locally verified, and developer-reviewed on
`phase/12-playable-react-game`. Commit and push are authorized. It is not
deployed or merged.

## Implemented scope

- Added a strict frontend game API client for create, get, Roll, Hold, and
  Restart.
- Added a winning-score setup form that creates a game between the two signed-in
  seats.
- Rendered player scores, round score, dice, turn, winner, and server-provided
  permissions.
- Sent every protected request with only the currently selected seat's token.
- Refetched game state when the acting seat changes so permissions remain
  caller-specific.
- Kept all game rules, dice, scores, turns, and winner decisions on the backend.
- Added safe 401, missing-game, malformed-response, and network-error handling.
- Added API-client, component, and application integration coverage.

## Local verification

- Focused frontend tests passed: 3 files and 31 tests.
- Root verification passed backend and frontend lint.
- Backend unit tests passed: 8 suites and 70 tests.
- MongoDB E2E tests passed: 4 suites and 42 tests.
- Frontend tests passed: 4 files and 36 tests.
- Backend and frontend builds passed; Vite transformed 24 modules.
- Backend production, backend full, and frontend audits found zero
  vulnerabilities.
- Full-history Gitleaks scanned 32 commits with no leaks.
- The working-tree scan found only the already verified public NestJS badge URL
  in `api/README.md`; a focused frontend scan found no leaks.

## Manual verification

- Started the built API and Vite frontend against an isolated local database.
- Registered and signed in two temporary players in independent seats.
- Created a target-20 game, rolled repeatedly, held, switched turns, restarted
  from the other seat, and played through a win.
- Confirmed the UI refreshed caller-specific permissions on seat changes.
- Confirmed Roll and Hold disabled for the wrong seat and after victory while
  Restart remained available.
- Confirmed the 390px layout had no horizontal overflow.
- Confirmed an API outage produced a visible `Failed to fetch` game alert.
- Browser logs contained no application warnings or errors before the
  deliberate outage; observed warnings came from an unrelated extension.

## Security boundary

- No dependency, environment variable, secret, cookie, browser storage, raw
  HTML, or database schema was added.
- Access tokens remain only in React memory and are sent only in exact bearer
  headers.
- React submits opponent ID and winning score only during creation; action
  bodies are empty.
- Response validation rejects malformed or inconsistent server game state.
- The UI renders server-provided `allowedActions` and does not infer rules.
- A game-request 401 clears only the rejected seat.

## Out of scope

- Backend endpoint, engine, authentication, or authorization changes
- MongoDB game persistence or recovery after API restart
- Optimistic concurrency and duplicate-action protection
- Lifetime win-counter updates
- Swagger/OpenAPI generation
- Production deployment or provider configuration
- UI animation, reduced-motion polish, and Phase 14 refinements
- Commit, push, pull request, merge, or Phase 13 implementation

## Next action

Create and push the approved Phase 12 commit, then wait. Do not deploy, merge,
or begin Phase 13 without explicit approval.
