# Phase 18 - BUST feedback cooldown

Date: 2026-08-01

Implementation branch: `phase/18-bust-feedback-cooldown`

Status: Implemented and locally verified; awaiting review. Not committed,
pushed, merged, or deployed.

## Goal

Implement the optional assignment behavior that briefly disables actions and
shows feedback after double six, while preserving complete backend ownership
of dice interpretation, scoring, turn selection, and caller permissions.

## Implementation

- React starts a three-second cooldown only after a successful action response
  reports the backend semantic `BUST` event.
- The event key combines game ID and authoritative version, so rerenders and
  same-version refetches cannot restart it.
- React immediately selects the returned active player and refetches the same
  game with that authenticated seat's in-memory token.
- Roll, Hold, and New Game remain disabled during 3 -> 2 -> 1 and while the
  required refetch is pending.
- Failed refetches and missing sessions keep actions locked and expose clear
  recovery feedback without discarding the last safe game response.
- Timer cleanup prevents callbacks after unmount or after switching games.
- GameBoard renders an accessible atomic status, numeric countdown, progress,
  and ready feedback with responsive and reduced-motion styling.
- No dependency, backend source, API contract, schema, environment setting, or
  game rule changed.

## Verification

- Focused frontend: 3 files, 49 tests passed.
- Focused backend domain/service: 2 suites, 43 tests passed.
- Focused game API E2E: 1 suite, 17 tests passed.
- Complete root verification: 109 backend unit tests, 51 MongoDB E2E tests,
  54 frontend tests, lint, and both production builds passed.
- Separate API and web production builds passed.
- Backend production, backend full, and frontend audits reported zero
  vulnerabilities.
- Docker Compose configuration passed.
- Gitleaks full-history and focused scans reported no leaks.
- A real random browser BUST verified immediate handoff, 3 -> 2 -> 1, locked
  actions, ready-state unlock, same-game continuation, normal Roll and Hold,
  and layouts at desktop, 768px, and 390px.

## Security

- The frontend consumes only backend-returned `lastEvent`,
  `activePlayerId`, `version`, and `allowedActions`.
- It contains no raw-dice BUST rule, score update, next-player calculation, or
  permission calculation.
- Access tokens remain memory-only, and no sensitive configuration or data was
  added.

## Remaining review item

The connected browser surface could not emulate the operating system's
reduced-motion preference. The CSS media path and component behavior are
covered by source inspection and automated tests; a live OS-level toggle
remains unverified.
