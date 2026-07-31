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
