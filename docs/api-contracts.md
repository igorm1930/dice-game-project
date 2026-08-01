# API Contracts

## Status

The health, read-only user, authentication, and game endpoints are implemented
and tested. Phase 14 adds version-guarded game mutations, consistent errors,
liveness/readiness routes, and generated OpenAPI documentation.

Only document endpoints after they exist and have been tested.

## Health endpoint

### Request

`GET /api/health`

Authentication: not required.

Request body: none.

### Success response

Status: `200 OK`

```json
{
  "status": "ok",
  "service": "dice-game-api"
}
```

Both response fields are fixed strings. The endpoint accepts no user input.
Success requires an active Mongoose connection.

`GET /api/health/ready` provides the same MongoDB readiness contract.
`GET /api/health/live` reports process liveness without depending on MongoDB.

### Errors

If the API is running but MongoDB becomes disconnected, the endpoint returns
`503 Service Unavailable` with code `SERVICE_UNAVAILABLE` and message
`Database connection is unavailable`.

If MongoDB is unavailable during startup, the API makes three bounded
connection attempts and exits instead of serving an unhealthy application.
Invalid or missing runtime configuration also prevents startup with a clear
validation error.

### Example

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/health'
```

The backend uses a global `/api` prefix, so the generated root greeting is
available at `GET /api`, not `GET /`.

## OpenAPI and error contracts

- `GET /api/docs` serves Swagger UI.
- `GET /api/openapi.json` serves the generated OpenAPI document.
- Every error contains `statusCode`, `code`, and `message`.
- Validation errors use `VALIDATION_ERROR`.
- Unexpected errors use `INTERNAL_SERVER_ERROR` and the generic message
  `Internal server error.`

Swagger documents bearer authentication but does not persist authorization
between page loads.

## User endpoints

Authentication: not required. These routes expose only public account data.
`POST /api/users` was removed in Phase 8 so account creation cannot bypass
password hashing.

### List users

`GET /api/users`

Success: `200 OK` with an array of public user responses ordered by creation
time and ID. Public responses contain `id`, `username`, `wins`, `createdAt`,
and `updatedAt`. An empty collection returns an empty array.

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/users'
```

### Get user by ID

`GET /api/users/:id`

Success: `200 OK` with one public user response.

Errors:

- `400 Bad Request` when `id` is not a MongoDB ID
- `404 Not Found` with `User not found` when a valid ID has no user

MongoDB `_id`, password fields, and internal counted-game IDs are never
returned. `wins` is incremented once per won game.

## Authentication endpoints

### Register

`POST /api/auth/register`

Authentication: not required. Rate limit: 3 requests per minute per client IP.

Request body:

```json
{
  "username": "Player.One",
  "password": "a private password"
}
```

The username is trimmed and must match `^[a-zA-Z0-9._-]{3,30}$`. The password
must be a string containing 10-128 characters and is not trimmed or normalized.
Unknown fields are rejected.

Success: `201 Created` with the public user response. Registration does not
return a token.

Errors:

- `400 Bad Request` for invalid or extra input
- `409 Conflict` with code `USERNAME_UNAVAILABLE` for a normalized duplicate
- `429 Too Many Requests` after the per-IP limit

### Login

`POST /api/auth/login`

Authentication: not required. Rate limit: 5 requests per minute per client IP.

The request accepts the same `username` and `password` fields. A valid login
returns `200 OK`:

```json
{
  "accessToken": "<JWT access token>",
  "tokenType": "Bearer",
  "expiresIn": 1800
}
```

An unknown username and incorrect password both return:

```json
{
  "statusCode": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid username or password."
}
```

The token is an HS256 bearer access token with a 30-minute lifetime.

### Current user

`GET /api/auth/me`

Authentication: required through `Authorization: Bearer <access-token>`.
The backend uses only the verified JWT `sub` claim for identity.

Success: `200 OK` with the public user response.

Missing, malformed, expired, incorrectly signed, or incorrectly constrained
tokens return:

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "Authentication required."
}
```

## Game endpoints

All game endpoints require `Authorization: Bearer <access-token>`. The acting
player is always the verified JWT subject; request bodies never select the
actor. An invalid or missing token returns `401 UNAUTHORIZED`.

Game IDs remain UUID v4 strings. The complete authoritative state is stored in
one MongoDB `games` document and survives API-process restarts. The API does
not expose a game-listing or browser-refresh resume endpoint; a client must
already know the game ID.

### Game response

Every successful game operation returns the caller-specific state. It includes
a non-negative `version` and a matching strong `ETag`:

```json
{
  "id": "d43acc2f-a715-49a1-bf4f-74b16592e553",
  "version": 0,
  "players": [
    { "id": "66c10cb50d521a70d4d8d111", "globalScore": 0 },
    { "id": "66c10cb50d521a70d4d8d222", "globalScore": 0 }
  ],
  "activePlayerId": "66c10cb50d521a70d4d8d111",
  "roundScore": 0,
  "winningScore": 100,
  "lastRoll": null,
  "status": "active",
  "winnerId": null,
  "allowedActions": ["roll", "hold", "restart"]
}
```

`status` is `active` or `won`; `lastRoll` is `null` or two integers from 1
through 6. The active caller receives all three actions while another
participant or either participant after victory receives only `restart`.

### Create game

`POST /api/games`

Body:

```json
{
  "opponentId": "66c10cb50d521a70d4d8d222",
  "winningScore": 100
}
```

`opponentId` must be a MongoDB object ID for a distinct credentialed user.
`winningScore` is optional, defaults to 100, and must be an integer from 1
through `Number.MAX_SAFE_INTEGER`. Unknown fields are rejected. Success is
`201 Created` with the game response and the caller as Player 1.

Errors include `400 INVALID_PLAYERS`, `404 OPPONENT_NOT_FOUND`, and standard
validation errors. The not-found response does not distinguish an absent user
from a legacy passwordless user.

### Get game

GET /api/games/:id requires a UUID v4. Success is 200 with the game response.
An absent game and a game hidden from a nonparticipant both return the same
404 GAME_NOT_FOUND response.

### Roll

POST /api/games/:id/roll requires an empty body and an `If-Match` header
containing the quoted version from the latest response. Success is 200 with
the updated game response and incremented version. Dice come from backend
cryptographic randomness.
Wrong-turn callers receive 409 NOT_YOUR_TURN; Roll after a win returns 409
GAME_FINISHED. A stale or duplicate request returns 409 GAME_STATE_CONFLICT.

### Hold

POST /api/games/:id/hold requires the same empty body and `If-Match` header.
Success is 200 with the updated game response. Only the active participant may
Hold. The same NOT_YOUR_TURN, GAME_FINISHED, and GAME_STATE_CONFLICT responses
apply as for Roll. The first successful winning transition increments the
winner's lifetime counter exactly once.

### Restart

POST /api/games/:id/restart requires an empty body and current `If-Match`
header. Either participant may restart an active or won game. Success is 200;
scores, round score, last roll, status, winner, and active turn reset while
players and winning score remain unchanged.

For all action routes, authoritative client fields such as actor/player IDs,
dice, scores, turns, winner state, or allowed actions are unknown fields and
produce 400 Bad Request.
Missing, weak, unquoted, negative, or unsafe `If-Match` values return
400 INVALID_GAME_VERSION.

## Documentation rule

For every implemented endpoint, document:

- method
- path
- authentication requirement
- request body
- response body
- validation
- status codes
- error format
- example request
- example response

Do not describe an endpoint as implemented before it exists.
