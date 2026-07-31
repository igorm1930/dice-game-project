# Session 011 - In-memory game API

Date: 2026-07-31

## Scope

Phase 10 was merged into `main` as `0c68d23`. Work continued on
`phase/11-in-memory-game-api` and remained limited to the approved
authenticated in-memory game API. No frontend game UI, persistence, deployment,
commit, push, merge, or Phase 12 work was performed.

## Implementation

- Added `GameModule`, controller, service, DTOs, repository interface, and
  process-local repository.
- Added UUID v4 game IDs and backend `crypto.randomInt(1, 7)` dice.
- Exposed authenticated create, get, roll, hold, and restart endpoints.
- Reused the configured JWT guard/module and Phase 10 pure game engine.
- Derived the actor only from the verified JWT subject.
- Required distinct credentialed opponents and rejected passwordless legacy
  users.
- Hid games from nonparticipants, enforced active-turn Roll/Hold, and allowed
  either participant to Restart.
- Returned caller-specific allowed actions and rejected authoritative action
  request fields.
- Added deterministic service tests and real-MongoDB E2E tests.

## Files

Created:

- `api/src/game/game.constants.ts`
- `api/src/game/dto/create-game.dto.ts`
- `api/src/game/dto/game-id-param.dto.ts`
- `api/src/game/dto/game-response.dto.ts`
- `api/src/game/repositories/game.repository.ts`
- `api/src/game/repositories/in-memory-game.repository.ts`
- `api/src/game/infrastructure/secure-dice-roller.ts`
- `api/src/game/game.service.ts`
- `api/src/game/game.controller.ts`
- `api/src/game/game.module.ts`
- `api/src/game/game.service.spec.ts`
- `api/test/games.e2e-spec.ts`
- this session log

Modified:

- `api/src/app.module.ts`
- `api/src/auth/auth.module.ts`
- `api/src/users/users.service.ts`
- `api/src/users/users.service.spec.ts`
- `api/test/test-application.ts`
- Phase/status, decisions, API, architecture, authentication, and testing docs

## Verification

- Focused unit command passed: 3 suites and 46 tests.
- API lint and build passed.
- New games E2E command passed: 1 suite and 12 tests.
- Root verification passed:
  - backend unit: 8 suites and 70 tests
  - frontend: 2 files and 14 tests
  - backend E2E: 4 suites and 42 tests
  - backend and frontend builds passed
  - Vite transformed 22 modules
- Backend production, backend full, and frontend audits found zero
  vulnerabilities.
- Full-history Gitleaks 8.30.1 scanned 31 commits and found no leaks.
- The working-tree scan found exactly one item: the previously verified public
  NestJS starter badge URL in `api/README.md`. No other item was found. The
  directory-scan fingerprint differs from the approved historical fingerprint,
  so `.gitleaksignore` was not broadened.

The first restricted root verification reached frontend Vitest and failed to
spawn its worker with Windows `EPERM`. The identical approved command passed
with normal process-spawn access; this was a sandbox limitation, not a test
failure.

## Manual API verification

The built API ran on temporary port 3011 against an isolated local database.
Two temporary users were registered and logged in without displaying their
generated credentials. The flow confirmed:

- health returned OK
- game creation returned two players
- the opponent could retrieve the same game and saw only Restart allowed
- the opponent received 409 outside their turn
- backend-generated dice stayed in the inclusive 1-6 range
- Hold completed through the current actor
- the other participant could Restart and restore initial state

The isolated database was dropped, the API process was stopped, and temporary
logs were removed.

## Security review

- No dependency, runtime variable, or secret was introduced.
- Every game route uses the existing JWT guard.
- Actor identity comes only from the verified token subject.
- Missing and unauthorized game lookups have the same 404 response.
- Client identity, dice, scores, turns, winner state, and allowed actions are
  rejected on action routes.
- Dice are generated only on the backend.
- Game state remains memory-only and is not authoritative across processes.

## Remaining unverified or deferred

- CI will run only after an approved commit/push.
- Production deployment was not changed or tested.
- In-memory game loss after API restart is intentional but was not repeated as
  a separate destructive-state manual check.
- Cross-process consistency, persistence, optimistic concurrency,
  duplicate-action protection, win counters, frontend gameplay, and browser
  gameplay remain later-phase work.

## Git

Developer review passed and the Phase 11 commit and push were explicitly
authorized. Merge, deployment, and Phase 12 remain unauthorized.
