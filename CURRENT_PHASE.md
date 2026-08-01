# Current Phase

## Phase

Phase 16 - Versioned game rules and turn handoff fix

## Status

Completed, reviewed, and published. Commit `ce100e4` was merged through pull
request #17 as `81dd742`. Post-merge CI passed, and both Render services are
live on the Phase 16 merge commit.

## Implemented scope

- Preserved the production `double-six-v1` behavior: only `[6, 6]` busts;
  every other valid pair scores the dice sum.
- Added a framework-independent `GameRules` policy and semantic `RollOutcome`
  so `GameEngine` contains no concrete bust combination.
- Added normalized, immutable unordered-combination matching and proved a
  test-only multi-combination rule set works without changing the engine.
- Persisted each game's `ruleSetId`; restart preserves it, legacy records
  explicitly use `double-six-v1`, and unknown stored IDs fail safely.
- Added semantic `lastEvent` responses. React renders generic Bust feedback
  from that event and never infers rules from raw dice.
- Kept caller permissions backend-owned. After a successful turn-changing
  action, React selects the authenticated active seat and refetches the same
  game with that seat's token.
- Added domain, registry, repository, service, MongoDB E2E, API-client,
  component, and rendered-App regression coverage.
- Completed the 38-rule assignment traceability audit with no missing or
  contradictory mandatory behavior.

## Verification summary

- Focused rule, engine, repository, and service tests: 4 suites and 57 passed.
- Focused game API E2E tests: 17 passed.
- Focused frontend tests: 3 files and 38 passed.
- Complete root verification passed 13 backend suites with 107 tests, 4 MongoDB
  E2E suites with 50 tests, 4 frontend files with 43 tests, lint, and both
  production builds.
- Backend production, backend complete, and frontend dependency audits found
  zero vulnerabilities.
- Docker Compose configuration resolved successfully.
- Gitleaks scanned 37 commits, all modified directories, and the complete
  tracked diff with no leaks.
- Pull-request and post-merge Verify and Secret scan jobs passed.
- Production health, liveness, readiness, OpenAPI, exact-origin CORS, and the
  hosted frontend returned HTTP 200 on `81dd742`.

## Manual verification

- An isolated browser session signed in two temporary authenticated users.
- After Player A accumulated 437 round points, a real random double six
  occurred on roll 63. The UI cleared only the round score, kept both global
  scores at zero, selected Seat B, displayed generic Bust feedback, and
  enabled Roll, Hold, and New Game.
- Seat B rolled 5 and 4, held 9 points in the same active game, and control
  returned automatically to Seat A. No application browser errors occurred.
- The exact local processes and `dice_game_rules_manual` database were
  removed. No production user or game was created.

## Security boundary

- No dependency, runtime configuration, secret, authentication rule, or
  authorization rule changed.
- Rule resolution is an explicit backend registry; clients cannot select a
  rule ID or provide executable rules.
- Unknown stored rule IDs return a safe generic error without mutating state;
  legacy fallback is limited to records where the field is absent.
- The next player's existing in-memory token is used only for the same
  caller-specific game refetch already used by manual seat switching.
- React still does not calculate dice, scores, turns, or allowed actions.
- No secret, environment file, credential, or production data was added.

## Out of scope

- Production bust combinations other than `[6, 6]`
- User-selectable rule sets, rule UI, executable/database-driven rules, or
  dynamic plugins
- Unrelated authentication, deployment, UI, dependency, or configuration work
- Production data creation or provider configuration changes
- A new phase or unrelated feature work without separate approval

## Next action

Phase 16 is closed. No Phase 17 scope is approved. Keep `main` clean and wait
for an explicitly proposed next phase or maintenance task.
