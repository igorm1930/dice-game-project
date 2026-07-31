# Architecture

## Status

Phase 6 continuous-integration architecture is implemented and verified
locally and in GitHub Actions.

## Current implemented architecture

```text
dice-game-project/
|-- api/          NestJS, validation, Mongoose, health, and users
|-- web/          React health status, user form, and user list
|-- .github/      Read-only CI verification and secret scanning
`-- compose.yaml  Local MongoDB development service
```

Authentication, authorization, and game-domain implementation have not
started.

### Backend request path

1. `ConfigModule` validates backend runtime configuration.
2. `DatabaseModule` connects Mongoose with bounded retries.
3. A global `ValidationPipe` transforms DTOs, removes no silently accepted
   fields, and rejects non-whitelisted properties.
4. `UsersController` exposes create, list, and ID lookup routes.
5. `UsersService` owns persistence, duplicate error mapping, lookup, and
   explicit response construction.
6. The user schema stores `username` and Mongoose timestamps. A
   case-insensitive unique index protects username uniqueness under races.
7. API responses expose only `id`, `username`, `createdAt`, and `updatedAt`.

### User persistence flow

```text
React form
  -> createUser(username)
  -> POST /api/users
  -> CreateUserDto validation and trimming
  -> UsersService
  -> MongoDB users collection
  -> explicit UserResponseDto
  -> React saved-player list
```

`GET /api/users` reloads the persisted list. `GET /api/users/:id` validates the
MongoDB ID before querying. A verified API-process restart preserved stored
users because MongoDB owns the data.

### Frontend path

1. The existing health request renders API connection state.
2. `web/src/api/users.ts` performs create/list calls, checks HTTP failures, and
   validates response shapes.
3. `App` loads stored users on mount and renders loading, error, empty, or list
   state.
4. The labeled username form provides native constraints and renders server
   errors without trusting client validation.
5. React renders usernames as text, so stored values are escaped.

### Security boundary

The only new persisted user input is `username`. The backend trims it and
requires 3-30 characters from letters, numbers, dots, underscores, or hyphens.
Clients cannot supply IDs or timestamps. No passwords, tokens, authentication,
or private frontend configuration exist in Phase 4.

The user endpoints are intentionally unauthenticated until Phase 8 and must not
be treated as production-ready account endpoints.

### Local database

MongoDB 7.0.39 remains bound only to `127.0.0.1:27018` with a named volume and
healthcheck.

### Continuous-integration path

```text
pull request or push to main
  |-- Verify
  |     |-- Node.js 22
  |     |-- locked backend and frontend installs
  |     |-- production dependency audits
  |     |-- digest-pinned MongoDB service
  |     `-- lint -> unit tests -> E2E tests -> both builds
  `-- Secret scan
        |-- full Git history checkout
        `-- Gitleaks 8.30.1
```

Both jobs run with read-only repository and pull-request permissions. Checkout
credentials are not persisted, actions use full commit SHAs, and no custom
repository secrets are required. The one Gitleaks ignore entry is scoped to the
exact fingerprint of a verified public NestJS starter badge false positive.

## Future sections

When implemented, document authentication, the two-seat identity model, game
engine boundaries, repository interfaces, error flow, and deployment.
