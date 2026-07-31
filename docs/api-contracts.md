# API Contracts

## Status

The health, read-only user, and Phase 8 authentication endpoints are
implemented and tested.

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

### Errors

If the API is running but MongoDB becomes disconnected, the endpoint returns
`503 Service Unavailable` with Nest's standard error body and the message
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

MongoDB `_id`, version fields, and internal documents are never returned.

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
