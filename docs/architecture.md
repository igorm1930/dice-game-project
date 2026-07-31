# Architecture

## Status

Phase 2 API connection architecture is implemented and verified.

This document must describe only architecture that actually exists in the repository.

Do not document planned components as completed components.

## Approved direction

The planned direction is:

- NestJS backend
- React frontend
- MongoDB persistence
- JWT authentication
- backend-owned game logic
- frontend renders server state
- incremental implementation

## Current implemented architecture

The repository contains two applications connected through an HTTP health
request:

```text
dice-game-project/
├── api/   NestJS and TypeScript backend
└── web/   React, TypeScript, and Vite frontend
```

There is no database, authentication, authorization, or game-domain
implementation yet.

### Backend execution path

1. `api/src/main.ts` requires `FRONTEND_ORIGIN` before creating the server.
2. It bootstraps NestJS with `AppModule`, applies the global `/api` prefix,
   and enables CORS for only the configured origin or requests without an
   `Origin` header.
3. `api/src/app.module.ts` imports `HealthModule` alongside the generated
   controller and service.
4. `api/src/health/health.controller.ts` maps `GET /api/health` and returns
   the fixed health payload.
5. The generated root greeting remains available at `GET /api`.

The application listens on `process.env.PORT` when supplied, or port `3000`
otherwise.

### Frontend execution path

1. `web/index.html` supplies the browser document and the `root` element.
2. `web/src/main.tsx` creates the React root and renders `App` in
   `StrictMode`.
3. `web/src/config.ts` requires the public `VITE_API_URL` value and normalizes
   trailing slashes.
4. `web/src/api/health.ts` requests `/api/health`, checks the HTTP result, and
   validates the response shape.
5. `web/src/App.tsx` starts that request in an effect and renders loading,
   success, or error state. An `AbortController` cleans up the request during
   React Strict Mode remounting.
6. `web/src/index.css` and `web/src/App.css` provide the page styling.

`web/vite.config.ts` enables the React plugin and rejects development startup
or production builds when `VITE_API_URL` is missing. No development proxy is
used; the browser calls the configured backend URL directly.

### Request flow

```text
React App
  -> getHealth()
  -> fetch(VITE_API_URL + /api/health)
  -> NestJS HealthController
  -> { "status": "ok", "service": "dice-game-api" }
  -> validated frontend state
  -> loading, success, or error UI
```

`VITE_API_URL` and `FRONTEND_ORIGIN` are public operational values documented
with placeholders in `web/.env.example` and `api/.env.example`. Real `.env`
files remain ignored.

### Generated and project-specific files

Nest CLI generated the backend source, tests, TypeScript, Jest, ESLint,
Prettier, and npm configuration. Vite generated the frontend source, assets,
TypeScript, Oxlint, Vite, and npm configuration.

`api/.gitignore` excludes dependencies, build/test output, logs, and local
environment files while allowing `.env.example`.

## Future sections

When implemented, document:

- repository structure
- MongoDB connection
- authentication flow
- two-seat identity model
- game-engine boundary
- repository interfaces
- error flow
- deployment architecture
