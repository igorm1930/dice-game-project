# Phase 17 - Win counter visibility and restarted-game persistence

Date: 2026-08-01

Implementation branch: `phase/17-win-counter-visibility`

Implementation commit: `0fe346a`

Pull request: #19

Merge commit: `f86e3f3`

## Defect and root cause

Lifetime wins were already persisted in each MongoDB user document. The defect
was the idempotency key: Restart reuses the same game ID, but win recording
also used that game ID forever. The first win incremented correctly; every
later legitimate win after Restart was treated as a retry and suppressed.

The UI also made the stored totals hard to discover. Game cards used a small
label, Saved Players omitted wins, and the winner banner did not state the
updated lifetime total. Some won-game refetch paths did not refresh users.

## Fix

- Generate a private UUID for every winning Hold and persist it as
  `winEventId` on the game record.
- Clear `winEventId` on Restart and on non-winning active state.
- Pass the win-event ID to the existing atomic user update. Repeated repair of
  one event remains idempotent, while a later victory receives a new key.
- Fall back to the game ID only for legacy won records without `winEventId`.
- Refresh users after every direct or refetched won-game response.
- Display `Wins: N` in both game cards and Saved Players, and include the
  updated lifetime total in the winner banner.
- Keep React free of win calculation and persistence.

## Verification

- Focused backend service/repository tests passed, including distinct events
  across Restart, retry idempotency, and legacy compatibility.
- The dedicated win-counter E2E test won twice in the same restarted game,
  verified users and `auth/me` totals `1 -> 2`, concurrent repair safety, and
  persistence across an API restart.
- Focused frontend tests passed for rendering and won-game refresh paths.
- Complete root verification passed 109 backend unit tests, 51 MongoDB E2E
  tests, 44 frontend tests, lint, and both builds.
- All three dependency audits reported zero vulnerabilities. Full-history and
  working-tree Gitleaks scans reported no leaks.
- Manual two-user verification observed totals `0 -> 1 -> 2`, immediate UI
  updates, refresh persistence, and re-login persistence. Temporary processes
  and the isolated database were removed.
- Pull request #19 and post-merge main CI passed Verify and Secret scan.
- Render deployed merge commit `f86e3f3` to both services. Health, liveness,
  readiness, OpenAPI, and frontend smoke checks returned HTTP 200. The hosted
  Saved Players list displayed `Wins: N` with no application browser errors.

## Security

- No dependency, environment, secret, authentication, authorization, or CORS
  setting changed.
- The client cannot submit or choose win-event IDs and never increments wins.
- Production verification was read-only and created no account or game.

## Remaining limitation

Previously suppressed historical wins cannot be reconstructed automatically
because the single restarted game record no longer contains those prior won
states.
