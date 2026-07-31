# API Contracts

## Status

The Phase 3 database-aware health endpoint is implemented and tested.

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

Authentication: not required in Phase 4.

### Create user

`POST /api/users`

Request body: one `username` field. The backend trims the value and requires
3-30 letters, numbers, dots, underscores, or hyphens. Unknown fields are
rejected.

Success: `201 Created` with `id`, `username`, `createdAt`, and `updatedAt`.

Errors:

- `400 Bad Request` for missing, invalid, or extra input
- `409 Conflict` with `Username is already in use` for a case-insensitive
  duplicate

```powershell
$body = @{ username = 'Player.One' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/users' `
  -ContentType 'application/json' -Body $body
```

### List users

`GET /api/users`

Success: `200 OK` with an array of public user responses ordered by creation
time and ID. An empty collection returns an empty array.

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
