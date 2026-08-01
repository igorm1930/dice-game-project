# Current Phase

## Phase

Phase 17 - Win counter visibility and restarted-game persistence

## Status

Completed, reviewed, and published. Commit `0fe346a` was merged through pull
request #19 as `f86e3f3`. Pull-request and post-merge CI passed, and both
Render services are live on the Phase 17 merge commit.

## Implemented scope

- Reproduced the persistence defect: Restart keeps the same game ID, while the
  old game-ID idempotency key suppressed every legitimate later win.
- Added a private server-generated UUID `winEventId` for each winning Hold.
- Persisted that ID with the game, cleared it on Restart, and retained a
  game-ID fallback only for legacy won records that lack the new field.
- Deduplicated `UsersService.recordGameWin` by win event, so retries remain
  safe while later same-game victories increment correctly.
- Refreshed users whenever React receives a won game response, including
  direct Hold, seat refetch, and version-conflict recovery paths.
- Displayed `Wins: N` clearly in both game cards and Saved Players, and showed
  the winner's updated lifetime total in the winner banner.
- Kept all win calculation, persistence, repair, and idempotency in the
  backend. React only renders returned values.

## Verification summary

- Complete root verification passed 109 backend unit tests, 51 MongoDB E2E
  tests, 44 frontend tests, lint, and both production builds.
- Focused backend, API E2E, and frontend regressions passed.
- Backend production, backend complete, and frontend dependency audits found
  zero vulnerabilities.
- Full-history, tracked-diff, and focused untracked Gitleaks scans found no
  leaks; `git diff --check` passed.
- Pull-request and post-merge Verify and Secret scan jobs passed.
- Production health, liveness, readiness, OpenAPI, and the hosted frontend
  returned HTTP 200 on `f86e3f3`.

## Manual verification

- Two isolated authenticated users completed a target-1 game twice with the
  same winner and the same restarted game.
- The lifetime total changed `0 -> 1 -> 2` immediately in both game cards,
  Saved Players, and the winner banner.
- The value remained 2 after page refresh and a new login.
- The browser contained no application errors. Exact local processes were
  stopped and the isolated database with two temporary users and one game was
  dropped.
- Production verification was read-only. Render showed both services live on
  `f86e3f3`, and the hosted Saved Players list displayed `Wins: N`.

## Security boundary

- No dependency, secret, runtime configuration, authentication, or
  authorization behavior changed.
- `winEventId` is generated and consumed only by the backend and is not part
  of any client mutation body.
- React does not calculate, increment, or persist wins.
- Existing hidden counted-win storage remains private; legacy compatibility is
  limited to already-won records without a win-event ID.
- No production data or provider setting was changed.

## Remaining limitation

Historical wins that were suppressed before this fix cannot be reconstructed
automatically because Restart overwrote the prior state under the same game
record.

## Next action

Phase 17 is closed. No Phase 18 scope is approved. Keep `main` clean and wait
for an explicitly proposed maintenance task or new phase.
