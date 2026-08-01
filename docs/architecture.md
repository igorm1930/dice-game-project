# Architecture

## Status

Phase 13 is merged into `main` as `93e188b`. Phase 14 hardening and polish are
implemented on `phase/14-hardening-and-polish`. The deployed application
remains on the previous version pending separate approval.

## Current implemented architecture

```text
dice-game-project/
|-- api/          NestJS API plus framework-independent game domain
|-- web/          React two-seat authentication and playable game interface
|-- .github/      Read-only CI verification and secret scanning
|-- render.yaml   Planned Render API and static-site services
`-- compose.yaml  Local MongoDB development service
```

The backend remains authoritative for game rules and participant/turn
authorization. React renders validated server state and caller-specific
permissions.

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
10. A global exception filter emits stable error shapes and hides unexpected
    exception details.
11. A request interceptor logs only method, route template, status, and
    duration.
12. Swagger UI and OpenAPI JSON are generated from controllers and DTOs.

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

### Frontend game path

```text
two in-memory authenticated seats
  -> selected acting-seat token
  -> web/src/api/games.ts
  -> authenticated game endpoint
  -> validated caller-specific game response
  -> GameBoard server-state rendering
```

The selected seat creates a game against the other signed-in seat. Changing
the selected seat refetches the game with that seat's bearer token so the
backend can return its `allowedActions`. Roll, Hold, and Restart send empty
action bodies plus the latest version through `If-Match`. `GameBoard` displays
player scores, lifetime wins, round score, dice, turn, double-six feedback,
winner, and action availability without reproducing game rules.

The current game reference and access tokens remain only in React memory, while
the authoritative game record is stored in MongoDB. An open page can refetch
its known game after an API restart. A game-request 401 clears only the
rejected seat; a missing game returns the screen to game setup. A version
conflict refetches and renders the latest authoritative state.

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

### Persistent game API

`GameModule` connects authenticated HTTP requests to the pure engine:

```text
verified JWT subject
  -> GameController
  -> GameService authorization
  -> GameEngine transition
  -> MongooseGameRepository
  -> MongoDB games document
  -> caller-specific GameResponseDto
```

The asynchronous repository interface stores UUID v4 IDs and numeric versions.
Production uses the UUID as the MongoDB string `_id` and persists both players
and scores, active-player index, round score, winning score, last roll, status,
winner, and timestamps in one `games` document. Each action updates that
single document after the service authorizes the caller and runs the pure
engine transition. Updates atomically match both `_id` and `version`, then
increment the version. Existing documents without a version are treated as
version zero for their first guarded update.

The previous `Map` repository remains only for isolated service tests.
`SecureDiceRoller` implements the domain dice interface with Node
`crypto.randomInt`; tests replace the same injection token deterministically.

The service hides records from nonparticipants, limits Roll and Hold to the
active player, permits either participant to Restart, and maps domain state to
caller-specific allowed actions. User lookup permits only credentialed
opponents. Stale or duplicate actions map to a safe conflict. A winning
transition records its game ID and increments the winner in one idempotent
user-document update; later participant reads safely repair an interrupted
counter update without double counting.

### Security boundary

Registration accepts an untrusted username and password through validated DTOs.
Passwords are never trimmed, stored, returned, or logged. Password hashes are
excluded from normal Mongoose queries. JWT secrets exist only in backend
runtime configuration, while tokens contain only account identity claims.
The browser keeps access tokens only in React memory and clears passwords after
submission. It does not use cookies, browser storage, URLs, or request-body
identity fields for authentication.

Game documents contain participant IDs and authoritative state but no access
tokens, password data, or client-provided actor identity. Schema validators
constrain UUID and player IDs, exactly two distinct players, safe scores, dice,
status, winner, and version consistency. Mutations require a validated strong
`If-Match` value and use optimistic concurrency to prevent duplicate state
transitions.

Unexpected HTTP errors return a generic response. Request logs exclude bodies,
headers, tokens, passwords, query strings, and concrete user/game IDs.
Swagger exposes the public API surface but stores no credentials.

`POST /api/users` is removed so callers cannot create passwordless accounts.
The public list and ID routes remain read-only. Existing Phase 4-7 records can
still be listed with a derived zero-win response, but cannot authenticate and
their case-insensitive usernames remain reserved.

### Local database

MongoDB 7.0.39 remains bound only to `127.0.0.1:27018` with a named volume and
healthcheck.

`/api/health/live` checks the process, `/api/health/ready` checks MongoDB, and
the existing `/api/health` remains the Render-compatible readiness route.

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

Phase 15 will document final deployment, fresh-clone verification, screenshots,
known limitations, and the interview walkthrough.
