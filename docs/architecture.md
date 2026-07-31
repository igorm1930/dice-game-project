# Architecture

## Status

Phase 8 backend authentication is merged into `main`. Phase 9 two-seat
frontend authentication is implemented and locally verified on its phase
branch. The deployed application remains on the previous frontend version.

## Current implemented architecture

```text
dice-game-project/
|-- api/          NestJS, authentication, validation, Mongoose, health, users
|-- web/          React two-seat authentication, health, and public user list
|-- .github/      Read-only CI verification and secret scanning
|-- render.yaml   Planned Render API and static-site services
`-- compose.yaml  Local MongoDB development service
```

Game authorization and game-domain implementation have not started.

### Backend request path

1. `ConfigModule` validates backend runtime configuration.
2. `DatabaseModule` connects Mongoose with bounded retries.
3. A global `ValidationPipe` transforms DTOs, removes no silently accepted
   fields, and rejects non-whitelisted properties.
4. `AuthController` exposes rate-limited registration and login plus protected
   current-user lookup.
5. `AuthService` hashes passwords with Argon2id and signs HS256 access tokens.
6. `JwtAuthGuard` verifies signature, algorithm, expiry, issuer, audience,
   subject, and token use before attaching the derived caller identity.
7. `UsersService` owns persistence, normalized duplicate mapping, safe lookup,
   and explicit response construction.
8. The user schema stores normalized usernames, excluded password hashes, win
   totals, and timestamps. Unique indexes protect username races.
9. API responses expose only `id`, `username`, `wins`, `createdAt`, and
   `updatedAt`.

### Registration and login flow

```text
POST /api/auth/register
  -> RegisterDto validation
  -> Argon2id password hash
  -> normalized unique user document
  -> explicit public UserResponseDto

POST /api/auth/login
  -> generic credential verification
  -> HS256 access token
  -> GET /api/auth/me
  -> verified JWT sub
  -> explicit public UserResponseDto
```

`GET /api/users` reloads the persisted list. `GET /api/users/:id` validates the
MongoDB ID before querying. A verified API-process restart preserved stored
users because MongoDB owns the data.

### Frontend path

1. The existing health request renders API connection state.
2. `web/src/api/users.ts` performs the public list call, checks HTTP failures,
   and validates response shapes.
3. `web/src/api/auth.ts` validates registration, login, token, error, and
   current-user response shapes.
4. Seat A and Seat B own separate form and session state.
5. A login token is stored only after `GET /api/auth/me` returns its
   backend-derived public user.
6. The acting-seat selector passes the selected in-memory token to protected
   requests; it sends no trusted actor identifier.
7. A 401 removes only the rejected seat, logout removes only its selected
   session, and page refresh clears both sessions.
8. React renders usernames as text, so stored values are escaped.

### Security boundary

Registration accepts an untrusted username and password through validated DTOs.
Passwords are never trimmed, stored, returned, or logged. Password hashes are
excluded from normal Mongoose queries. JWT secrets exist only in backend
runtime configuration, while tokens contain only account identity claims.
The browser keeps access tokens only in React memory and clears passwords after
submission. It does not use cookies, browser storage, URLs, or request-body
identity fields for authentication.

`POST /api/users` is removed so callers cannot create passwordless accounts.
The public list and ID routes remain read-only. Existing Phase 4-7 records can
still be listed with a derived zero-win response, but cannot authenticate and
their case-insensitive usernames remain reserved.

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

### Configured deployment path

```text
Render static site (Frankfurt)
  -> exact HTTPS CORS origin
  -> Render Node API (Frankfurt)
  -> SRV connection with explicit dice_game database
  -> MongoDB Atlas M0
```

The Blueprint pins Node.js 22.22.0, waits for passing GitHub checks before
automatic deployment, uses `/api/health` as the API health check, and keeps
`MONGODB_URI` and `JWT_SECRET` out of source. The API listens on all container
interfaces but
production CORS accepts only the configured HTTPS frontend origin.

Atlas is planned with a database-scoped application user and only Render's
current Frankfurt outbound IP ranges. No wildcard network rule, paid fallback,
or preview environment is approved. This topology is configuration only until
the external resources and production flow are separately verified.

## Future sections

When implemented, document the game engine boundaries, repository interfaces,
and game error flow.
