# Architecture

## Status

Phase 10 is merged into `main`. Phase 11's authenticated in-memory game API is
implemented and locally verified on its phase branch. The deployed application
remains on the previous frontend version.

## Current implemented architecture

```text
dice-game-project/
|-- api/          NestJS API plus framework-independent game domain
|-- web/          React two-seat authentication, health, and public user list
|-- .github/      Read-only CI verification and secret scanning
|-- render.yaml   Planned Render API and static-site services
`-- compose.yaml  Local MongoDB development service
```

Game API integration and participant/turn authorization are implemented in
the backend. React game integration has not started.

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

### Pure game engine

`api/src/game/domain` contains a framework-independent `GameEngine`. It owns
the immutable game state and the `createGame`, `roll`, `hold`, and
`restart` transitions.

```text
injected DiceRoller
  -> GameEngine.roll(readonly GameState)
  -> validated two-die result
  -> new GameState
```

The state contains exactly two player IDs and global scores, the active-player
index, round score, winning score, most recent dice, status, and winner ID.
Only double six busts. Hold is the only transition that banks points and checks
for `globalScore >= winningScore`.

The engine throws explicit `GameRuleError` codes for invalid players, invalid
winning scores, invalid injected dice, and actions after victory. It imports no
NestJS, HTTP, Mongoose, MongoDB, authentication, or React code.

### In-memory game API

`GameModule` connects authenticated HTTP requests to the pure engine:

```text
verified JWT subject
  -> GameController
  -> GameService authorization
  -> GameEngine transition
  -> InMemoryGameRepository
  -> caller-specific GameResponseDto
```

The repository interface stores records with UUID v4 IDs. Its current
`Map` implementation is process-local and intentionally loses games on API
restart. `SecureDiceRoller` implements the domain dice interface with Node
`crypto.randomInt`; tests replace the same injection token deterministically.

The service hides records from nonparticipants, limits Roll and Hold to the
active player, permits either participant to Restart, and maps domain state to
caller-specific allowed actions. User lookup permits only credentialed
opponents. No Mongoose game schema or frontend game rule exists yet.

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

When implemented, document the persistent game repository, concurrency model,
and frontend game rendering path.
