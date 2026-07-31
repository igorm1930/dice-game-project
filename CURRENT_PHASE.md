# Current Phase

## Phase

Phase 7 - Initial deployment flow

## Status

The Phase 7 application is deployed and its production health, CORS, frontend,
and Atlas persistence flow are verified. The initial deployment commit
`532558b` is pushed. A two-line Render build-command correction and this
verified-reality documentation remain uncommitted and unpushed.

## Goal

Prepare a secure, reproducible Render and MongoDB Atlas deployment for the
existing health and persistent-user flow, then verify that flow in production
after separate approval to create external resources.

## Implemented local scope

- Added a Render Blueprint for one free Node web service and one free static
  site in Frankfurt.
- Fixed the planned public service names and URLs so frontend and CORS
  configuration agree before provisioning.
- Pinned the Render Node runtime to 22.22.0 and gated automatic deployment on
  passing GitHub checks.
- Added API health-check configuration and single-page application rewrites.
- Added baseline static-site response headers.
- Marked the MongoDB connection string as a dashboard-supplied secret.
- Made the NestJS server listen on all container interfaces.
- Required HTTPS frontend origins and MongoDB SRV connections in production.
- Required every MongoDB URI to contain an explicit database name.
- Added focused tests for the new production validation.
- Documented the planned deployment, least-privilege database access,
  verification, rollback, free-tier limitations, and security boundaries.

## Local verification record

- Backend production configuration tests passed: 1 suite and 10 tests.
- Root verification passed.
- Backend lint passed.
- Backend unit tests passed: 5 suites and 20 tests.
- Backend E2E tests passed against MongoDB: 2 suites and 11 tests.
- Frontend lint and component tests passed: 1 file and 5 tests.
- Backend and frontend builds passed; Vite 8.1.5 transformed 20 modules.
- Backend production and frontend dependency audits reported zero
  vulnerabilities.
- Docker Compose configuration passed and MongoDB was healthy.
- Render Blueprint formatting passed.
- The built frontend contained the planned public API URL and no private
  backend configuration patterns.

## Production verification record

- Render created the free API and static-site services with the planned names.
- Atlas created the free `dice-game-production` M0 cluster in Frankfurt.
- `dice_game_app` has only the custom `readWrite` role for `dice_game` and
  access to only the production cluster.
- Atlas has exactly Render's two Frankfurt outbound ranges,
  `74.220.51.0/24` and `74.220.59.0/24`; both are active.
- The API build initially failed because production npm settings omitted the
  Nest CLI. Using `npm ci --include=dev` fixed the API and static builds.
- The API health endpoint returned HTTP 200 with the expected JSON.
- The configured frontend origin received CORS permission; an unapproved origin
  did not.
- The hosted frontend connected, created demonstration user
  `phase7-check-20260731-1507`, and retained it after reload.
- Atlas Data Explorer confirmed that document in `dice_game.users`.
- Static-site security headers and SPA fallback returned HTTP 200.
- Provider logs contained no database URI, database username, password, or
  unhandled/error marker.
- Full local verification passed: 20 backend unit tests, 11 backend E2E tests,
  5 frontend tests, lint, and both builds.
- Gitleaks found no leaks in all 22 commits or the uncommitted diff.

## Remaining before Phase 7 completion

- Review and explicitly approve committing and pushing the build-command and
  verified-reality documentation changes.
- Open a pull request or push to `main` so the CI workflow is triggered, then
  confirm both required jobs pass.
- Verify the real Render free-tier cold-start delay after the API has idled.
- Merge only after explicit approval and successful required checks.

## Out of scope

- Authentication, authorization, passwords, JWTs, and Phase 8 work
- Game rules, game endpoints, and game UI
- Paid Render or Atlas resources
- Preview environments or automatic database provisioning
- Custom domains
- Wildcard Atlas network access
- Production secrets in source, chat, logs, screenshots, or frontend variables

## Approval

The developer approved the Phase 7 implementation and external Render, Atlas,
GitHub App, secret-entry, and deployment actions. No new commit, push, pull
request, or merge is authorized by this status update.
