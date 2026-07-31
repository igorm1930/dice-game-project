# Current Phase

## Phase

Phase 3 - MongoDB connection

## Status

Completed, reviewed, committed, and pushed - awaiting merge

## Goal

Connect the NestJS backend to MongoDB through validated runtime configuration
and verify successful connection, failure behavior, and recovery without adding
user or game persistence.

## In scope

- Add `@nestjs/config`, `@nestjs/mongoose`, and `mongoose`
- Add typed startup validation for backend configuration
- Add required private backend `MONGODB_URI` configuration
- Update `api/.env.example` with placeholder-only values
- Add an isolated local MongoDB service through Docker Compose
- Bind the local MongoDB port only to `127.0.0.1`
- Connect NestJS to MongoDB
- Make the health endpoint depend on the live database connection
- Add unit and end-to-end coverage for database health
- Verify connected startup, database loss, failure behavior, and recovery
- Run lint, tests, builds, audits, and security checks
- Update documentation only after verification

## Out of scope

- User schemas or user persistence
- User creation endpoints or frontend forms
- Authentication, password hashing, or JWT
- Game schemas, state, rules, dice, scoring, or APIs
- Frontend feature changes
- TanStack Query
- CI or deployment
- Shared packages
- Phase 4 or later work

## Configuration

- `NODE_ENV`: backend runtime environment
- `PORT`: backend HTTP port
- `FRONTEND_ORIGIN`: exact public frontend origin for CORS
- `MONGODB_URI`: private backend database connection string

`MONGODB_URI` must never be exposed through a `VITE_` variable or committed in
a real `.env` file.

## Completion criteria

- Required configuration is validated at startup
- `MONGODB_URI` is documented with a placeholder
- Real `.env` files remain ignored
- MongoDB is bound only to localhost for local development
- NestJS connects successfully to MongoDB
- The health endpoint succeeds only while MongoDB is connected
- Missing or invalid configuration fails clearly
- Database unavailability and recovery are verified
- Backend unit and end-to-end tests pass
- Backend and frontend lint and builds pass
- Dependency audits and secret/configuration scans are reviewed
- No Phase 4 or later functionality is added
- Documentation reflects only verified behavior
- Git status and the complete diff are reviewed
- No commit or push is created automatically

## Approval

The developer approved this Phase 3 scope before implementation.

## Verification record

- Added `@nestjs/config`, `@nestjs/mongoose`, and Mongoose.
- Added typed validation for `NODE_ENV`, `PORT`, `FRONTEND_ORIGIN`, and
  `MONGODB_URI`.
- Added an isolated MongoDB 7.0.39 Compose service bound to
  `127.0.0.1:27018` with a persistent named volume and health check.
- Left the pre-existing port-27017 container untouched.
- Backend lint passed.
- Backend unit tests passed: 4 suites and 11 tests.
- Live-MongoDB end-to-end tests passed: 1 suite and 2 tests.
- Backend and frontend builds passed.
- Connected health returned HTTP 200.
- Stopping MongoDB changed health to HTTP 503.
- Restarting MongoDB restored health to HTTP 200.
- Starting the API without MongoDB failed after three clear retries.
- Missing `MONGODB_URI` failed immediately with a clear validation error.
- Backend production, backend full, and frontend audits reported zero current
  vulnerabilities.
- Environment, credential, frontend-bundle, and Docker binding checks passed.
- Developer review was approved.
- Phase 3 was committed as `285864f` and pushed to
  `origin/phase/03-mongodb-connection`.

Phase 4 has not started.
