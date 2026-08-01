# Interview Walkthrough

## Five-to-ten-minute narrative

### 1. Start with the requirement

The assignment is a two-player dice game. The main design constraint is that
two users share one browser page without weakening backend identity. Seat A and
Seat B therefore hold independent memory-only sessions, and every protected
request sends only the selected seat's JWT.

### 2. Show the architecture

Open `docs/architecture.md`. React is a renderer and request client. NestJS
validates input, derives identity from the token, authorizes the participant
and turn, runs a framework-independent game engine, and persists the result in
MongoDB.

The pure engine is easy to test because dice are injected. Production uses
`crypto.randomInt`; tests use deterministic sequences.

### 3. Explain security

- Passwords are hashed with Argon2id and never returned or logged.
- JWT verification fixes HS256 and validates expiry, issuer, audience, subject,
  and token use.
- Tokens stay in memory; no cookie, local storage, URL token, or client-supplied
  actor ID is trusted.
- DTOs reject unknown fields.
- Nonparticipants see a hidden-record 404.
- Request logs contain only method, route template, status, and duration.

### 4. Explain game integrity

The backend owns Roll, Hold, double-six, winner, and Restart. Each game response
includes a version and strong ETag. Mutations require the latest `If-Match` and
atomically match/increment the MongoDB version, preventing duplicate or stale
actions. React handles a conflict by refetching authoritative state.

Lifetime wins are idempotent: a hidden per-user set records which game IDs were
already counted.

### 5. Demonstrate the UI

1. Point out the two independently authenticated seats.
2. Switch the acting-seat radio and verify the protected identity.
3. Choose a low winning target for a short demo.
4. Start the game, Roll, and Hold.
5. Show server-controlled action availability, dice, round/global scores,
   winner feedback, and lifetime wins.
6. Switch seats to show caller-specific permissions.
7. Show the mobile winner screenshot and reduced-motion/accessibility support.

### 6. Show test and delivery evidence

The root `npm.cmd run verify` runs:

- backend and frontend lint
- 95 backend unit tests
- 40 frontend tests
- 47 MongoDB E2E tests
- both builds

GitHub Actions repeats locked installs, audits, Node.js 22 verification, and
full-history Gitleaks with read-only permissions. `docs/final-verification.md`
records the fresh-clone replay and read-only production checks.

### 7. Close with tradeoffs

The project intentionally avoids WebSockets, game discovery, browser-persistent
sessions, distributed rate limiting, and old-game retention policy. Those are
listed in `docs/known-limitations.md` so the delivered scope and next
production steps are explicit.

## Useful links during the interview

- Hosted game: https://dice-game-web-igorm1930.onrender.com
- Swagger: https://dice-game-api-igorm1930.onrender.com/api/docs
- Final evidence: `docs/final-verification.md`
- API contracts: `docs/api-contracts.md`
- Security policy: `docs/security-policy.md`
