# Session 007 - Initial Deployment Flow

## Status

Phase 7 is completed, deployed, verified, and merged into `main` as
`dd3e1bc`. The production flow, pull-request checks, post-merge `main`
checks, and real idle cold start all passed.

## Changes

- Added `render.yaml` for the planned free Render API and static-site services.
- Made NestJS listen on `0.0.0.0` for a hosted container environment.
- Added production-only HTTPS and MongoDB SRV validation.
- Required an explicit database name in every MongoDB URI.
- Added four focused environment validation tests.
- Added deployment, architecture, testing, checklist, and status documentation.
- Provisioned the approved free Render API/static services and Atlas M0 cluster.
- Configured a database-scoped application role and exactly two Render outbound
  CIDRs without wildcard access.
- Corrected both Render build commands to install build-time dev dependencies.

## Verification

- Focused environment tests: 1 suite, 10 tests passed.
- Root verification: passed.
- Backend unit tests: 5 suites, 20 tests passed.
- Backend E2E: 2 suites, 11 tests passed.
- Frontend component tests: 1 file, 5 tests passed.
- Backend and frontend lint: passed.
- Backend and frontend builds: passed.
- Backend production audit: 0 vulnerabilities.
- Frontend audit: 0 vulnerabilities.
- Docker Compose configuration and MongoDB health: passed.
- Render Blueprint Prettier check: passed.
- Frontend build contained the expected public API URL and no private backend
  configuration patterns.
- Render API and static builds completed successfully.
- Hosted health and exact-origin CORS checks passed; an unapproved origin
  received no CORS permission.
- Browser user creation and reload persistence passed.
- Atlas Data Explorer confirmed the demonstration document in
  `dice_game.users`.
- Static security headers and SPA fallback passed.
- Full-history Gitleaks scanned 22 commits with no findings; the uncommitted
  diff scan also found no findings.
- Draft pull request #8 passed Verify in 1 minute 10 seconds and Secret scan in
  6 seconds.
- Post-merge `main` Verify passed in 1 minute 2 seconds and Secret scan passed
  in 8 seconds.
- A real free-tier cold start returned HTTP 200 in 32.4 seconds after more than
  15 idle minutes.
- The hosted frontend reconnected afterward and retained the demonstration
  user.

The first root verification stopped at formatting because the edited
TypeScript files had LF line endings and one expression needed Prettier
wrapping. Only those three changed TypeScript files were formatted; the
complete root verification then passed.

## Security review

- `MONGODB_URI` is a provider-entered secret and has no committed value.
- No wildcard Atlas access is planned.
- Production CORS requires an exact HTTPS frontend origin.
- Production MongoDB requires an SRV URI with an explicit database.
- The frontend bundle contains only the intended public API URL.
- The Phase 6 fingerprint-only Gitleaks ignore remains unchanged.
- The public user endpoints remain unauthenticated and are limited to
  demonstration data until Phase 8.
- Atlas exposes only Render's two active Frankfurt outbound CIDRs.
- Provider-log inspection found no database URI, database user, password, or
  application error marker.
- A deploy-hook URL exposed by the provider settings accessibility output was
  immediately rotated and was never stored or used.

## Completion

- Pull request #8 was marked ready and merged as `dd3e1bc`.
- Required post-merge `main` checks passed.
- Phase 8 has not started and requires a separate approved proposal.
