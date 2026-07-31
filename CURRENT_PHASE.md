# Current Phase

## Phase

Phase 9 - Two authenticated users on one page

## Status

Phase 9 is implemented, locally verified, and approved by the developer on
`phase/09-two-authenticated-users`. It has not been committed, pushed,
deployed, or merged.

## Implemented scope

- Added independent Seat A and Seat B frontend authentication sessions.
- Added registration and login controls for each seat.
- Kept registration separate from login.
- Validated each login token through protected `GET /api/auth/me` before
  accepting the session.
- Added an explicit acting-seat selector.
- Sent only the selected seat's bearer token for protected identity checks.
- Derived displayed identity only from the backend response.
- Added independent logout and per-seat authentication errors.
- Kept passwords and access tokens only in React memory.
- Preserved the health check and public read-only player list.

## Local verification

- Root lint passed for backend and frontend.
- Backend unit tests passed: 6 suites and 31 tests.
- MongoDB E2E tests passed: 3 suites and 30 tests.
- Frontend tests passed: 2 files and 14 tests.
- Backend and frontend builds passed; Vite transformed 22 modules.
- Backend production and frontend dependency audits found zero vulnerabilities.
- The known backend development-tool audit remains at 25 high findings.
- Gitleaks scanned 26 commits and the uncommitted Phase 9 diff with no leaks.
- `git diff --check` passed.

## Manual verification

- Registered two temporary accounts in an isolated local database.
- Confirmed registration did not authenticate either seat.
- Logged Seat A and Seat B in independently.
- Verified the acting selector resolved Seat A and Seat B to their own
  backend-derived identities.
- Confirmed logging out Seat B preserved Seat A and selected it as the
  fallback acting seat.
- Confirmed a page refresh logged out both memory-only sessions.
- Confirmed the 390px layout had no horizontal overflow.
- Confirmed signed-out seat regions have distinct accessible names.
- Found no application console errors; warnings came from an unrelated browser
  extension.
- Deleted the two-user `dice_game_phase9_manual` database after verification.

## Security boundary

- Tokens are never rendered, logged, stored in browser storage, placed in URLs,
  or sent in request bodies.
- Password fields are cleared after each authentication submission.
- No client-supplied `userId`, `playerId`, or `actorId` is used.
- A protected-request 401 clears only the rejected seat.
- `VITE_API_URL` remains the only frontend configuration and is public.
- No backend authentication, authorization, CORS, schema, or configuration
  behavior changed.
- Authentication still does not authorize future game actions.

## Out of scope

- Phase 10 game engine
- Game endpoints, persistence, or playable UI
- Participant, turn, or action authorization
- Refresh tokens, cookies, OAuth, or password recovery
- Persistent frontend authentication
- Backend or database-schema changes
- Production deployment or provider configuration
- Commit, push, pull request, or merge

## Next action

Wait for explicit commit and push instructions. Do not deploy, merge, or begin
Phase 10 without explicit approval.
