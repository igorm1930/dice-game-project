# Session 007 - Initial Deployment Flow

## Status

Phase 7 is deployed and its core production flow is verified. A two-line Render
build-command correction and verified-reality documentation remain uncommitted
and unpushed. Hosted CI and real idle cold-start verification remain pending.

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

## Remaining

- Review the complete uncommitted diff and Git status.
- Commit and push only after explicit approval.
- Open a pull request or push to `main` to trigger hosted CI, then confirm it.
- Verify recovery after the free API service has actually idled.
- Merge only after explicit approval and successful required checks.
