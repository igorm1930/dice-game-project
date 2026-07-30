# Authentication and JWT Policy

## Status and implementation phases

This document records approved authentication, JWT, and authorization-boundary
decisions. It is a design policy, not evidence that authentication has been
implemented.

- Phase 8 implements backend authentication.
- Phase 9 implements two independent frontend seat sessions.

## Authentication model

- Use NestJS username/password authentication.
- Hash passwords with Argon2id.
- Use JWT bearer access tokens.
- Send access tokens with `Authorization: Bearer <access-token>`.
- Do not use authentication cookies.
- Do not add refresh tokens in the initial implementation.
- Do not add OAuth or social login.
- Registration does not automatically log the user in.

## Endpoints

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

## User model and responses

The user model contains:

- `username`
- `normalizedUsername`
- `passwordHash`
- `wins`
- `createdAt`
- `updatedAt`

`normalizedUsername` must have a unique MongoDB index.

`passwordHash` must be excluded from normal query results. User database
documents must not be serialized directly as API responses. Explicit response
DTOs must be used.

## Username rules

- Trim the username before validation.
- Minimum length: 3.
- Maximum length: 30.
- Allowed pattern: `^[a-zA-Z0-9._-]{3,30}$`.
- Uniqueness is case-insensitive.
- `normalizedUsername` is the lowercase username.
- Duplicate registration returns HTTP 409 with code
  `USERNAME_UNAVAILABLE`.

## Password rules

- Minimum length: 10.
- Maximum length: 128.
- Unicode and spaces are allowed.
- Do not trim or normalize passwords.
- Do not require arbitrary uppercase, lowercase, number, or symbol
  combinations.
- Never store, return, or log plaintext passwords.

## Password hashing

Use Argon2id with:

```text
memoryCost: 19456
timeCost: 2
parallelism: 1
```

Do not:

- use SHA-256 for passwords
- encrypt passwords
- manually generate password salts
- compare password hashes as ordinary strings
- store a shared salt

The Argon2 library must generate and encode the per-password salt as part of
the password hash.

## JWT design

- Algorithm: HS256.
- Access-token lifetime: 30 minutes.
- The JWT secret must contain at least 32 cryptographically random bytes.
- The secret must come only from backend runtime configuration.
- The secret must never be committed.
- The secret must never be exposed to React.
- No production fallback secret may exist in source code.
- Development, test, and production must use different secrets.

Required JWT configuration:

```text
JWT_SECRET
JWT_EXPIRES_IN=30m
JWT_ISSUER=dice-game-api
JWT_AUDIENCE=dice-game-web
```

Required JWT claims:

- `sub`: authenticated user ID
- `username`
- `tokenUse`: `access`
- `iat`
- `exp`
- `iss`
- `aud`

The verifier must explicitly validate:

- HS256 only
- signature
- expiration
- issuer
- audience
- `sub`
- `tokenUse` equals `access`

JWT payloads must not contain:

- password
- `passwordHash`
- database credentials
- secrets
- game scores
- dice values
- current turn
- winner
- complete game state
- sensitive personal information

## Login rules

An unknown username and an incorrect password must return the same response:

```text
HTTP 401
code: INVALID_CREDENTIALS
message: Invalid username or password.
```

The response must not reveal which part of the credentials was incorrect.

## Frontend token storage

- Store access tokens only in React memory.
- Do not use `localStorage`.
- Do not use `sessionStorage`.
- Do not use IndexedDB.
- Do not use cookies.
- Do not place tokens in URLs.
- Refreshing the browser logs out both seats.
- Logging out removes the token from memory.

## Two-seat model

- Seat A and Seat B hold independent users and access tokens.
- The UI contains an explicit `Acting as` selector.
- Each request uses the active seat token.
- The frontend must not send trusted `userId`, `playerId`, or `actorId`
  fields.
- The backend derives acting identity only from JWT `sub`.

## Authentication and authorization

Authentication determines who is calling.

Authorization separately verifies:

- the user is a game participant
- the game is active
- it is the user's turn
- the requested action is legal

A valid JWT alone must never authorize a game action.

## Error rules

- Missing, invalid, or expired token: HTTP 401.
- Authenticated non-participant requesting another user's game: HTTP 404.
- Participant acting outside their turn: HTTP 409 with code
  `NOT_YOUR_TURN`.
- Action on a completed or abandoned game: HTTP 409.

## Backend configuration

Use `@nestjs/config` with startup validation.

Required backend variables:

```text
NODE_ENV
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
JWT_ISSUER
JWT_AUDIENCE
FRONTEND_ORIGIN
```

Backend secrets must come from runtime environment variables or an approved
secret manager. Only placeholder values may appear in `api/.env.example`.
Never create or commit a real `.env` file.

## Frontend configuration

The only authentication-related frontend configuration may be public
configuration such as:

```text
VITE_API_URL=http://localhost:3000
```

Never create:

- `VITE_JWT_SECRET`
- `VITE_MONGODB_URI`
- `VITE_DATABASE_PASSWORD`
- `VITE_GITHUB_TOKEN`
- `VITE_PRIVATE_API_KEY`

## Request validation

Use explicit DTO classes and a global `ValidationPipe` with:

```typescript
{
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}
```

## Rate limits

- Login: 5 requests per minute per IP.
- Registration: 3 requests per minute per IP.
- Exceeded limit: HTTP 429.
- Do not permanently lock accounts.

## Logging

Never log:

- passwords
- password hashes
- JWTs
- JWT secrets
- `Authorization` headers
- MongoDB credentials
- login or registration request bodies

## CORS and transport

- Development origin: `http://localhost:5173`.
- Production must use the exact deployed frontend origin.
- Production must not use `origin: '*'`.
- `credentials` must remain `false` because cookies are not used.
- Production authentication traffic must use HTTPS.

## Required tests

Phase 8 is incomplete until tests cover:

- password hashing
- response-data protection
- registration validation
- duplicate normalized usernames
- generic login failures
- valid login
- missing token
- malformed token
- invalid signature
- expired token
- wrong issuer
- wrong audience
- unsupported algorithm
- missing `sub`
- wrong `tokenUse`
- rate limiting
- no password or token leakage
- backend-derived actor identity
