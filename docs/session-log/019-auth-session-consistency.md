# Phase 19 - Authentication form and game-session consistency

Date: 2026-08-01

Implementation branch: `phase/19-auth-session-consistency`

Status: Implemented, locally verified, and reviewed; approved for commit and
push. Not merged or deployed.

## Goal

Correct registration-form cleanup and prevent an in-memory game from showing a
previous seat occupant after a different account signs in.

## Root cause

- `AuthSeat` always cleared the password but never cleared the username, and
  its registration callback returned no success result.
- Login replaced the seat session without checking whether the newly
  authenticated user belonged to the currently displayed backend game. The
  stale game and player-name cache therefore remained visible.

## Implementation

- Registration now returns a success boolean to the form. Success clears both
  credential fields; failure retains the username and clears the password.
- After login, React checks the authenticated user ID against the current
  server-returned players. An unrelated user clears the presentation cooldown,
  local game reference, and cached names, then shows a start-new-game notice.
- Reauthentication by the same participant preserves the current game.
- No backend state is changed and no game rule or participant is calculated by
  React.

## Verification

- Focused App suite: 28 tests passed.
- Complete root verification: 109 backend unit tests, 51 MongoDB E2E tests,
  57 frontend tests, lint, and both production builds passed.
- Backend production, backend complete, and frontend audits reported zero
  vulnerabilities.
- Docker Compose configuration passed. Gitleaks 8.30.1 scanned all 42 commits
  and focused modified paths without finding a leak.
- Real-browser verification passed successful and failed registration cleanup,
  two-seat authentication, stale-game removal after seat replacement, and a
  new game containing only the current Bravo and Charlie users.

## Security

- Passwords clear after every registration attempt.
- Tokens remain in memory and are not logged or stored in browser storage.
- No backend, API, database, dependency, CORS, environment, or secret behavior
  changed.

## Remaining action

Commit and push the reviewed branch. Do not merge or deploy without explicit
approval.
