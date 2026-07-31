# Phase 6 - Continuous integration

## Goal

Validate pull requests and `main` automatically with dependency installation,
audits, lint, tests, builds, MongoDB-backed E2E coverage, and secret scanning.

## Scope

The session added CI infrastructure and documentation only. Deployment,
repository settings, authentication, application behavior, and later phases
were excluded.

## Files changed

- Created `.github/workflows/ci.yml`.
- Created `.gitleaksignore`.
- Created this session log.
- Modified `api/package.json`.
- Modified `CURRENT_PHASE.md`, `PROJECT_CHECKLIST.md`, `README.md`, and
  `PROJECT_DECISIONS.md`.
- Modified `docs/architecture.md` and `docs/testing-strategy.md`.

## Commands executed

- Created `phase/06-continuous-integration` from updated `main`.
- Started and inspected the Compose MongoDB service.
- Ran clean installs in `api/` and `web/`.
- Ran the backend production and frontend dependency audits.
- Ran the root verification command with public `VITE_API_URL` configuration.
- Validated Docker Compose configuration.
- Ran Gitleaks 8.30.1 against full Git history.
- Scanned the workflow for forbidden permissions and credential patterns.
- Inspected the diff and Git status.

## Implementation summary

The `Verify` job installs both applications from lockfiles, audits production
dependencies, and runs the complete root verification command against a
MongoDB service. The `Secret scan` job checks full Git history with Gitleaks.
Both jobs use read-only permissions, immutable action references, and
non-persisted checkout credentials.

Backend lint now checks only. Developers can request source rewriting
explicitly with `npm run lint:fix`.

## Verification

- Backend and frontend clean installs passed.
- Backend production and frontend audits reported zero vulnerabilities.
- Backend unit tests passed: 5 suites and 16 tests.
- Backend E2E tests passed: 2 suites and 11 tests.
- Frontend tests passed: 1 file and 5 tests.
- Backend/frontend lint and builds passed.
- Compose configuration passed and MongoDB was healthy.
- Gitleaks scanned 19 commits and approximately 685.95 KB with no leaks after
  the exact approved false-positive fingerprint was ignored.
- The workflow security-pattern scan passed.
- GitHub-hosted execution remains pending until push.

## Problems encountered

Restricted process spawning caused the first clean install attempt to fail
with `spawn EPERM`; the same commands passed with normal process-spawn access.
Gitleaks initially detected the public placeholder in the generated NestJS
badge URL. The developer reviewed the exact redacted evidence and approved one
fingerprint-scoped ignore. No broader allowlist was added.

## Decisions made

- Use Node.js 22 for CI.
- Use full action SHAs and a MongoDB image digest.
- Keep workflow permissions read-only.
- Do not require custom GitHub secrets.
- Keep dependency and secret scans as separate security controls.

## Commit

No commit or push was performed.

## Next step

Developer review, followed by an explicitly approved commit and push. Confirm
both GitHub-hosted jobs pass before merge. Phase 7 must not start yet.
