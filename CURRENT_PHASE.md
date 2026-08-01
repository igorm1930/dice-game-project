# Current Phase

## Phase

Phase 19 - Authentication form and game-session consistency

## Status

Implemented, locally verified, and reviewed on branch
`phase/19-auth-session-consistency`. The branch is approved for publication
but has not been merged or deployed.

Phase 18 was merged through pull request #21 as `e4992a9`.

## Implemented scope

- Clear both credential fields after successful registration.
- Preserve the username for correction after failed registration while always
  clearing the password.
- When a different authenticated user replaces a seat and is not a participant
  in the displayed game, discard only the stale local game reference and show
  a clear prompt to start a new game.
- Preserve the displayed game when the same participant signs in again.
- Never relabel an existing backend game with a replacement account.
- Keep authoritative game state, participants, and rules in the backend.

## Verification summary

- The focused frontend regression suite passed 28 tests.
- Complete root verification passed 109 backend unit tests, 51 MongoDB E2E
  tests, 57 frontend tests, lint, and both production builds.
- Backend production, backend complete, and frontend dependency audits found
  zero vulnerabilities.
- Docker Compose configuration and full-history/focused Gitleaks scans passed.
- A real browser verified successful and failed registration field handling,
  two authenticated seats, stale-game removal after a seat replacement, and a
  new game containing only the two current users.

## Security boundary

- No backend, API contract, database, dependency, token, CORS, environment, or
  secret behavior changed.
- Access tokens remain in React memory and passwords are cleared after every
  registration attempt.
- React does not change server-side game participants or calculate game rules.

## Next action

Publish the reviewed Phase 19 branch, then wait for explicit merge approval.
Do not merge, deploy, or start another phase.
