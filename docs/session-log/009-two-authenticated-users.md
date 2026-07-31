# Session 009 - Two authenticated users on one page

## Goal

Add the interview-required two-user simulation without implementing game rules,
game endpoints, or persistent browser authentication.

## Implemented

- Added a validated frontend client for registration, login, and current-user
  requests.
- Added independent memory-only Seat A and Seat B sessions.
- Kept registration separate from login.
- Required a successful protected current-user response before storing a login
  session.
- Added an explicit acting-seat selector and protected identity verification.
- Added independent logout, scoped errors, and 401 session removal.
- Preserved health and public player-list behavior.
- Added responsive and accessible two-seat UI styling.

## Automated verification

- Root lint: passed.
- Backend unit tests: 6 suites and 31 tests passed.
- MongoDB E2E tests: 3 suites and 30 tests passed.
- Frontend tests: 2 files and 14 tests passed.
- Backend and frontend builds: passed; Vite transformed 22 modules.
- Backend production audit: 0 vulnerabilities.
- Frontend audit: 0 vulnerabilities.
- Backend full audit: the documented 25 high development-tool findings remain.
- Full-history Gitleaks: 26 commits, no leaks.
- Uncommitted Phase 9 diff scan: no leaks.
- `git diff --check`: passed.

The first restricted Vitest launch failed before configuration loading with the
known Windows `spawn EPERM` limitation. The identical command ran normally with
process-spawn access. The first Gitleaks command used a rejected `--source`
flag; the corrected v8.30.1 positional repository command completed the scan.

## Manual verification

- Used an isolated `dice_game_phase9_manual` database and ephemeral JWT secret.
- Registered `Phase9A731` and `Phase9B731`; neither registration created a
  session.
- Logged both seats in independently.
- Verified Seat A as `Phase9A731` and Seat B as `Phase9B731` through protected
  backend current-user requests.
- Logged out Seat B and confirmed Seat A remained active.
- Reloaded the page and confirmed both sessions were cleared.
- Confirmed the 390px layout had no horizontal overflow.
- Corrected and reverified distinct `Seat A` and `Seat B` accessible region
  names.
- Browser logs contained no application errors; warnings came from an unrelated
  extension.
- Deleted the isolated manual database after confirming it contained exactly
  the two temporary users.

An older local process already occupied IPv6 port 3001 and exposed stale API
routes. It was left untouched. Manual verification moved the temporary Phase 9
API to unused port 3011 and used an explicit IPv4 API URL.

## Security review

- Access tokens exist only in `App` React state.
- Password fields are cleared after every submission.
- No local storage, session storage, IndexedDB, cookies, URL tokens, or raw HTML
  rendering were introduced.
- Protected calls receive only the selected bearer token and no trusted actor
  identifier.
- A 401 clears only the rejected seat.
- No backend secret or new frontend configuration was added.
- Backend authentication and future game-authorization boundaries are
  unchanged.

## Remaining

Phase 9 has not been committed, pushed, deployed, reviewed, or merged. Phase 10
has not started.
