# Session 004 - Persistent User Flow

## Status

Phase 4 is implemented on `phase/04-persistent-user-flow`. Automated, direct
API, database-restart, build, audit, security, and Chrome checks passed. No
commit or push has been made.

## Implemented scope

- Added `class-validator` and `class-transformer`.
- Added the first user schema and case-insensitive unique username index.
- Added DTO validation, explicit public responses, and duplicate/not-found
  error mapping.
- Added create, list, and ID lookup endpoints.
- Added real-MongoDB E2E tests, including persistence across app restart.
- Added the React user client, creation form, saved list, and state handling.

## Verification

- Backend lint passed.
- Backend unit tests passed: 4 suites, 11 tests.
- Backend E2E passed: 2 suites, 11 tests.
- Backend build passed.
- Frontend lint passed.
- Frontend build passed: 20 transformed modules.
- Direct API checks returned the expected 201, 200, 400, 404, and 409 behavior.
- A real API-process restart preserved `ManualPlayer_731` in the isolated
  manual database.
- Frontend development HTML returned HTTP 200 with its React root and entry.
- Backend production/full and frontend audits returned zero vulnerabilities.
- Environment, credential, frontend-private-config, log, CORS, and diff checks
  passed.

The first frontend lint attempt exposed stripped JSX quotes from the Windows
patch transport. The file was corrected using quote-safe JSX, after which lint
passed. The first configured Vite build was blocked by sandbox `spawn EPERM`;
the identical build passed outside that restriction.

After the Chrome extension was connected, browser verification confirmed the
empty state, user creation, saved-user rendering, case-insensitive duplicate
feedback, reload persistence, and desktop/mobile layouts. It also found that
modern Chromium ignored the native username pattern because the hyphen was not
escaped. The pattern was corrected, then native invalid-input handling, lint,
and the configured build passed. No application console errors were found;
warnings originated from an unrelated installed Chrome extension.

## Security impact

Username and URL ID are untrusted. DTO validation, strict field whitelisting,
case-insensitive uniqueness, explicit response mapping, and React text escaping
protect the new boundary. No password, token, authentication field, secret, or
private frontend configuration was introduced. The public endpoints remain a
development-only Phase 4 flow until authentication is implemented later.

## Out of scope

No authentication, authorization, passwords, JWT, editing/deletion, game
logic, CI, deployment, or Phase 5 work was added.
