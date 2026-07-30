# Architecture

## Status

Phase 1 project foundation is implemented.

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

The repository contains two independent applications:

```text
dice-game-project/
├── api/   NestJS and TypeScript backend
└── web/   React, TypeScript, and Vite frontend
```

There is no frontend-to-backend connection, database, authentication, or game
domain implementation yet.

### Backend execution path

1. `api/src/main.ts` bootstraps NestJS with `AppModule`.
2. `api/src/app.module.ts` registers `AppController` and `AppService`.
3. `api/src/app.controller.ts` maps the generated `GET /` route.
4. The controller calls `AppService.getHello()`.
5. `api/src/app.service.ts` returns `Hello World!`.

The application listens on `process.env.PORT` when supplied, or port `3000`
otherwise.

### Frontend execution path

1. `web/index.html` supplies the browser document and the `root` element.
2. `web/src/main.tsx` creates the React root and renders `App` in
   `StrictMode`.
3. `web/src/App.tsx` renders the generated Vite starter interface.
4. `web/src/index.css` and `web/src/App.css` provide the generated styling.

`web/vite.config.ts` enables the React plugin. It does not yet define a backend
proxy or other Phase 2 integration.

### Generated and project-specific files

Nest CLI generated the backend source, tests, TypeScript, Jest, ESLint,
Prettier, and npm configuration. Vite generated the frontend source, assets,
TypeScript, Oxlint, Vite, and npm configuration.

`api/.gitignore` was added for this repository because the Nest command used
`--skip-git`; it excludes dependencies, build/test output, logs, and local
environment files while allowing a future `.env.example`.

## Future sections

When implemented, document:

- repository structure
- frontend-to-backend request flow
- backend module structure
- MongoDB connection
- authentication flow
- two-seat identity model
- game-engine boundary
- repository interfaces
- error flow
- deployment architecture
