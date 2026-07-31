# Current Phase

## Phase

Phase 7 - Initial deployment flow

## Status

Local deployment configuration is implemented and verified. No Render service,
MongoDB Atlas resource, production database user, or production data has been
created. The branch has not been committed or pushed.

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

## Remaining before Phase 7 completion

- Review and approve creation of the external Render and MongoDB Atlas
  resources.
- Create the Atlas M0 cluster and least-privilege application user.
- Restrict Atlas network access to Render's current Frankfurt outbound ranges;
  do not use a wildcard address.
- Enter the MongoDB connection string directly into Render as a secret.
- Validate the Blueprint against the connected Render account.
- Deploy both services and confirm the expected public URLs.
- Run production health, exact-origin CORS, user creation, Atlas persistence,
  refresh, and cold-start checks.
- Confirm GitHub Actions passes for the Phase 7 branch.
- Review, commit, push, and merge only after explicit approval.

## Out of scope

- Authentication, authorization, passwords, JWTs, and Phase 8 work
- Game rules, game endpoints, and game UI
- Paid Render or Atlas resources
- Preview environments or automatic database provisioning
- Custom domains
- Wildcard Atlas network access
- Production secrets in source, chat, logs, screenshots, or frontend variables

## Approval

The developer approved the exact Phase 7 local execution proposal before
implementation. External account changes require a separate approval after
reviewing the local configuration.
