# Phase 12 - Playable React game

Date: 2026-07-31

Branch: `phase/12-playable-react-game`

Base: Phase 11 merged into `main` as `28db4f1`

## Scope

Implemented the first complete React game flow against the existing
authenticated in-memory game API. No backend source, dependency, environment
variable, deployment configuration, or database schema was changed.

## Implementation

- Added a strict game API client for create, get, Roll, Hold, and Restart.
- Added a game setup form with a configurable winning score.
- Added player panels, global scores, round score, dice, turn, winner, and
  action controls.
- Used the selected seat's bearer token for every game request.
- Refetched game state after an acting-seat change.
- Enabled controls only from server-provided `allowedActions`.
- Kept game rules and authoritative values out of React.
- Added safe handling for malformed responses, 401 responses, missing
  in-memory games, and network failures.

## Automated verification

- Focused frontend tests: 3 files, 31 tests passed.
- Root verification:
  - backend lint passed
  - frontend lint passed
  - backend unit tests: 8 suites, 70 tests passed
  - backend E2E tests: 4 suites, 42 tests passed
  - frontend tests: 4 files, 36 tests passed
  - backend build passed
  - frontend build passed with Vite 8.1.5 and 24 transformed modules
- Backend production audit: zero vulnerabilities.
- Backend full audit: zero vulnerabilities.
- Frontend full audit: zero vulnerabilities.
- Full-history Gitleaks: 32 commits scanned with no leaks.
- Full-directory Gitleaks: only the previously verified public NestJS badge
  URL was reported.
- Focused frontend Gitleaks: no leaks.

## Manual verification

The built API and Vite frontend ran against an isolated local MongoDB database.
Two temporary users were registered and signed in to independent seats.

Verified:

- game creation with a target score of 20
- backend dice rendering and repeated Roll actions
- Hold banking and turn switching
- caller-specific permission refresh after changing the acting seat
- wrong-seat Roll and Hold disabling
- Restart from the other participant
- complete play through a winning Hold
- post-win Roll and Hold disabling with Restart still available
- 390px responsive rendering with no horizontal overflow
- visible `Failed to fetch` feedback after a deliberate API outage

Browser logs contained no application warnings or errors before the deliberate
outage. The observed warnings came from an unrelated Chrome extension.

## Security review

- Tokens remain in React memory and are not stored in cookies, browser storage,
  URLs, or source.
- Game actions send no actor ID, dice, score, turn, winner, or permission
  fields.
- Response validation rejects malformed or inconsistent game state.
- React renders server values as escaped text and uses no raw HTML.
- No client-side randomness or duplicated game-rule calculation was added.
- A rejected game token clears only its own seat.
- No secret or credential was added to tracked files.

## Deferred

- MongoDB game persistence and recovery after API restart
- optimistic concurrency and duplicate-action protection
- lifetime win updates
- Swagger/OpenAPI generation
- deployment changes
- Phase 14 animation, reduced-motion, and accessibility polish

## Git

The Phase 12 work was reviewed and approved for commit and push. Phase 13 has
not started.
