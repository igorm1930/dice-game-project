# Phase 16 - Versioned game rules and turn handoff fix

Date: 2026-08-01

Branch: `phase/16-turn-handoff-fix`

Base: merged `main` at `ebda55c`

## Defect

After double six, the backend correctly cleared the round score and changed
the active player. React kept the previous authenticated seat selected, so the
caller-specific response exposed only Restart and made the game appear stuck.

The domain transition, persistence, version increment, ETag, response mapping,
and caller-specific permission calculation were already correct. The missing
behavior was the frontend acting-seat handoff and refetch with the new active
player's existing token. Existing tests asserted the backend and `GameBoard`
in isolation but did not render the complete two-seat App continuation flow.

## Fix and rule architecture

- Added `GameRules.evaluateRoll` with semantic `SCORE(points)` and `BUST`
  outcomes; `GameEngine` contains no concrete dice-combination rule.
- Added an immutable unordered-combination policy and explicit registry. The
  only production policy is `double-six-v1` with normalized key `6-6`.
- Stored `ruleSetId` and semantic `lastEvent` in game state and MongoDB. New
  games select the production default, restart preserves it, missing legacy
  IDs explicitly map to it, and unknown stored IDs fail safely.
- Exposed `lastEvent` additively while keeping `ruleSetId` internal. React
  renders generic Bust feedback from the semantic event and does not compare
  dice values.
- When a successful action changes `activePlayerId`, React selects the signed-
  in seat for that player and refetches the same game with that seat's token.
  The backend still supplies Roll, Hold, and Restart permissions.

## Verification

- Focused rule, engine, repository, and service tests: 4 suites, 57 passed.
- Focused game API E2E tests: 17 passed.
- Focused frontend tests: 3 files, 38 passed.
- Complete root verification passed 107 backend unit tests, 50 MongoDB E2E
  tests, 43 frontend tests, lint, and both production builds. Vite transformed
  24 modules.
- Backend production, backend complete, and frontend audits found zero
  vulnerabilities.
- Docker Compose configuration resolved successfully.
- Gitleaks scanned 37 commits, every modified directory, and the complete
  tracked diff with no leaks.
- The rendered regression confirmed a zero round score, Seat B selection, a
  Seat B permission refetch, visible feedback, enabled controls, a Seat B Roll,
  a Seat B Hold, the same game ID, and only one game creation.
- The deterministic API E2E regression confirmed both callers' permissions,
  one version increment for the bust, raw MongoDB state, unchanged wins, a
  continued Roll and Hold, no additional game creation, stable rules across
  restart/API restart, explicit legacy compatibility, and safe unknown IDs.

## Assignment-rule traceability audit

The rule wording below follows the assignment PDF, the approved interpretations
in `PROJECT_DECISIONS.md`, and the approved Phase 16 rule-version guarantee.
`U`, `E`, `F`, and `B` mean unit, API/MongoDB E2E, frontend automated, and
manual browser coverage.

| # | Rule / approved interpretation | Implementation | U | E | F | B | Status |
| -: | --- | --- | :-: | :-: | :-: | :-: | --- |
| 1 | Exactly two distinct players | `GameEngine.createGame`; game schema | Yes | Yes | Yes | Yes | Covered |
| 2 | Player 1 begins a new game | `createGame`; `restart` | Yes | Yes | Yes | Yes | Covered |
| 3 | A turn rolls two dice | `DiceRoll`; `GameEngine.roll` | Yes | Yes | Yes | Yes | Covered |
| 4 | Dice are generated only by the backend | `secureDiceRoller`; injected test roller | Yes | Yes | Yes | Yes | Covered |
| 5 | Each die is between 1 and 6 | secure roller and engine validation | Yes | Yes | Yes | Yes | Covered |
| 6 | Ordinary rolls add both dice | `doubleSixV1GameRules`; `GameEngine.roll` | Yes | Yes | Yes | Yes | Covered |
| 7 | Repeated rolls accumulate in one turn | `GameEngine.roll` | Yes | Yes | Yes | Yes | Covered |
| 8 | A single six has no special meaning | `doubleSixV1GameRules` | Yes | Yes | Yes | Yes | Covered |
| 9 | Only double six busts in production | `doubleSixV1GameRules` normalized set | Yes | Yes | Yes | Yes | Covered |
| 10 | A Bust clears only round score | semantic `GameEngine.roll` transition | Yes | Yes | Yes | Yes | Covered |
| 11 | A Bust preserves global scores | semantic `GameEngine.roll` transition | Yes | Yes | Yes | Yes | Covered |
| 12 | A Bust passes the turn | semantic `GameEngine.roll` transition | Yes | Yes | Yes | Yes | Covered |
| 13 | A Bust does not finish or restart | engine, service, repository | Yes | Yes | Yes | Yes | Covered |
| 14 | Hold banks round score | `GameEngine.hold` | Yes | Yes | Yes | Yes | Covered |
| 15 | Hold clears round score | `GameEngine.hold` | Yes | Yes | Yes | Yes | Covered |
| 16 | Hold passes the turn | `GameEngine.hold` | Yes | Yes | Yes | Yes | Covered |
| 17 | Hold with zero is allowed and passes | `GameEngine.hold` | Yes | Yes | Yes | No | Covered |
| 18 | Victory is checked only on Hold | `GameEngine.hold` | Yes | Yes | Yes | No | Covered |
| 19 | Score equal to target wins | `GameEngine.hold` | Yes | Yes | Yes | No | Covered |
| 20 | Score above target wins | `GameEngine.hold` | Yes | Yes | N/A | No | Covered |
| 21 | Winner and completed status are returned | engine and `GameResponseDto` | Yes | Yes | Yes | No | Covered |
| 22 | Roll and Hold are blocked after victory | engine and service guards | Yes | Yes | Yes | No | Covered |
| 23 | Winning score defaults to 100 | `DEFAULT_WINNING_SCORE` | Yes | Yes | Yes | Yes | Covered |
| 24 | Valid custom winning score is supported | create DTO and engine | Yes | Yes | Yes | No | Covered |
| 25 | Target cannot change during active game | immutable state; empty mutation DTOs | Yes | Yes | Yes | No | Covered |
| 26 | Restart resets scores, round, dice, winner | `GameEngine.restart`; `RESTART` event | Yes | Yes | Yes | No | Covered |
| 27 | Restart preserves players, target, and rules | `GameEngine.restart` | Yes | Yes | Yes | No | Covered |
| 28 | Restart gives Player 1 the turn | `GameEngine.restart` | Yes | Yes | Yes | No | Covered |
| 29 | Either authenticated participant may restart | service authorization and DTO | Yes | Yes | Yes | No | Covered |
| 30 | Nonparticipants cannot see or mutate | `findVisibleGame` | Yes | Yes | N/A | No | Covered |
| 31 | Only active participant may Roll or Hold | `assertTurn` | Yes | Yes | Yes | Yes | Covered |
| 32 | Client authority fields are rejected | whitelist DTO validation and empty action DTO | Yes | Yes | Yes | Yes | Covered |
| 33 | Caller-specific actions are correct | `GameResponseDto` | Yes | Yes | Yes | Yes | Covered |
| 34 | Stale or duplicate mutations are rejected | `If-Match`; atomic versioned save | Yes | Yes | Yes | No | Covered |
| 35 | State survives API restart | MongoDB repository | Yes | Yes | Yes | No | Covered |
| 36 | A win is counted once | `UsersService.recordGameWin` | Yes | Yes | Yes | No | Covered |
| 37 | React renders backend state without game rules | semantic event, `App`, `GameBoard` | Review | Yes | Yes | Yes | Covered |
| 38 | A game's versioned rule set remains stable | registry, schema, repository, restart | Yes | Yes | N/A | Review | Covered |

No mandatory assignment rule is missing or contradictory. Manual coverage is
supplementary; deterministic unit, API/MongoDB, and frontend coverage is the
authority for cases that are unsafe or impractical to force manually.

## Security

- No dependency, secret, runtime configuration, authentication, or
  authorization behavior changed.
- Rule resolution uses a closed backend registry. Clients cannot choose a rule
  ID, submit combinations, store scripts, or execute expressions.
- Missing legacy IDs have one explicit compatibility mapping. Unknown stored
  IDs fail before mutation and return the existing generic unexpected-error
  response without leaking internal details.
- The frontend uses only the already authenticated next seat's in-memory token.
  Permissions remain server-provided; React does not infer allowed actions,
  scores, turns, winners, or bust combinations.
- The internal rule ID is not exposed publicly and authority fields remain
  rejected. No production data was created.

## Remaining verification

An isolated two-user browser game reached a real random double six on roll 63
after Player A had accumulated 437 round points. Both global scores remained
zero, the round score became zero, and Seat B was selected with Roll, Hold, and
New Game enabled. Seat B then rolled 5 and 4, held 9 points in the same active
game, and returned control to Seat A. The browser console had no errors. The
verified local processes and dedicated `dice_game_rules_manual` database were
removed.

There are no uncovered mandatory rules. Commit `ce100e4` was merged through
pull request #17 as `81dd742`. Pull-request and post-merge CI passed; both
Render services deployed the merge commit, production health and frontend
smoke checks passed, and no production data was created.
