# Architecture

## Status

Phase 3 MongoDB connection architecture is implemented and verified.

This document describes only architecture that exists in the repository.

## Current implemented architecture

The repository contains two applications and a local MongoDB service:

```text
dice-game-project/
|-- api/          NestJS, TypeScript, and Mongoose backend
|-- web/          React, TypeScript, and Vite frontend
`-- compose.yaml  Local MongoDB development service
```

The backend has a verified MongoDB connection but no schemas, models, or
persisted domain data. Authentication, authorization, and game-domain
implementation have not started.

### Backend execution path

1. The global Nest `ConfigModule` validates and types all backend environment
   variables before startup can complete.
2. `DatabaseModule` configures Mongoose with the validated `MONGODB_URI` and
   bounded connection retry settings.
3. `api/src/main.ts` bootstraps NestJS, applies the global `/api` prefix, and
   enables CORS for only the configured origin or requests without an
   `Origin` header.
4. `HealthModule` uses `DatabaseHealthService` to inspect the live Mongoose
   connection state.
5. `GET /api/health` returns the fixed success payload only while connected;
   otherwise it returns HTTP 503.
6. The generated root greeting remains available at `GET /api`.

Startup requires `NODE_ENV`, `PORT`, `FRONTEND_ORIGIN`, and `MONGODB_URI` to
pass typed validation. The application listens on the validated `PORT`.

### Frontend execution path

1. `web/src/config.ts` requires public `VITE_API_URL` configuration.
2. `web/src/api/health.ts` requests `/api/health`, checks the HTTP result, and
   validates the response shape.
3. `web/src/App.tsx` renders loading, success, or error state and cleans up its
   request during React Strict Mode remounting.

No development proxy is used; the browser calls the configured backend URL
directly.

### Request flow

```text
React App
  -> fetch(VITE_API_URL + /api/health)
  -> NestJS HealthController
  -> Mongoose connection-state check
  -> 200 fixed health payload or 503 unavailable
  -> validated frontend state
```

### Configuration boundary

`VITE_API_URL` and `FRONTEND_ORIGIN` are public operational values.
`MONGODB_URI` is private backend configuration and must never use the `VITE_`
prefix. Placeholder values are documented in `.env.example` files; real
`.env` files remain ignored.

### Local database

`compose.yaml` runs MongoDB 7.0.39 with a named volume. Its port is bound to
`127.0.0.1:27018`, avoiding the existing service on port 27017 and preventing
exposure on other host interfaces. The Compose healthcheck uses MongoDB's
`ping` command.

## Future sections

When implemented, document authentication, the two-seat identity model, game
engine boundaries, repository interfaces, error flow, and deployment.
