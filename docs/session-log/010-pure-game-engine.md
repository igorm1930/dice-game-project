# Session 010 - Pure backend game engine

## Goal

Implement every approved dice-game rule as a deterministic, immutable
TypeScript domain engine without introducing HTTP endpoints, persistence,
authorization, or frontend game logic.

## Implemented

- Added readonly two-player game, player, dice, status, and winner types.
- Added an injected `DiceRoller` interface.
- Added `createGame()`, `roll()`, `hold()`, and `restart()`.
- Added ordinary roll accumulation and double-six-only bust behavior.
- Added Hold banking, turn switching, and Hold-only winner detection.
- Added runtime validation for players, winning scores, and injected dice.
- Added explicit `GameRuleError` codes.
- Kept the domain free of NestJS, HTTP, authentication, Mongoose, MongoDB, and
  React imports.

## Automated verification

- Focused game-engine tests: 1 suite and 29 tests passed.
- Root lint: passed for backend and frontend.
- Backend unit tests: 7 suites and 60 tests passed.
- MongoDB E2E tests: 3 suites and 30 tests passed.
- Frontend tests: 2 files and 14 tests passed.
- Backend and frontend builds: passed; Vite transformed 22 modules.
- Backend production audit: 0 vulnerabilities.
- Frontend audit: 0 vulnerabilities.
- Backend full audit: the documented 25 high development-tool findings remain.
- Full-history Gitleaks: 29 commits scanned with no leaks.
- Local Phase 10 secret-pattern scan: no findings.
- `git diff --check`: passed.

The first root verification run intentionally reached the frontend build
without a configured `VITE_API_URL` and stopped with the existing clear
configuration error. The identical verification passed after setting the
public local value `http://127.0.0.1:3001` for that process only.

## Manual verification

The compiled engine was loaded directly. A deterministic trace created a game
with target 10, rolled 2 and 3, held 5 points, switched players, rolled double
six, cleared the round score, and switched back. Restart then reset scores,
dice, status, and winner while preserving both player IDs and the target.

No browser or HTTP check applies because this phase exposes neither.

## Security review

- No dependency, secret, environment variable, database field, or network
  interface was added.
- Dice are injected at the backend domain boundary and validated as exactly two
  integer values from 1 through 6.
- React neither generates nor submits dice or scores.
- Game transitions return new readonly state objects.
- Authentication and participant/turn authorization are unchanged and remain
  Phase 11 responsibilities.

## Remaining

- The developer approved the verified implementation. Commit `bd01e44` is
  pushed on `phase/10-pure-game-engine`, and pull request #11 is ready for
  review.
- GitHub CI passed both `Verify` and `Secret scan` on the committed branch.
- Merge still requires explicit approval.
- Phase 11 has not started.
