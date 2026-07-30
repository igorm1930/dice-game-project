# Current Phase

## Phase

Phase 2 — API connection

## Status

In progress

## Goal

Connect the React frontend to a small NestJS health endpoint and verify the
local frontend-to-backend request flow.

## In scope

- Add `GET /api/health`
- Add public frontend API URL configuration with `VITE_API_URL`
- Add backend frontend-origin configuration with `FRONTEND_ORIGIN`
- Document both public configuration values in `.env.example` files
- Configure local CORS for the exact frontend origin
- Connect React to the backend
- Display loading, success, and error states
- Add backend unit and end-to-end tests for the health endpoint
- Test the endpoint directly
- Test the local frontend-to-backend flow
- Run lint, tests, and builds
- Explain the important files and request flow

## Out of scope

- MongoDB
- Mongoose
- Typed NestJS configuration validation
- User schema
- User creation
- Authentication
- Password hashing
- JWT
- Game state
- Dice logic
- Game API
- TanStack Query
- Docker
- CI
- Deployment
- Shared package
- Optional game features

## Skill routing

Before any Phase 2 task, inspect available skills and follow
`docs/skill-routing.md`.

Select only skills whose trigger conditions match the task. State which skills will be used and why. If no suitable skill is available, say so and continue using the normal workflow.

This requirement does not expand Phase 2 scope.

## Required approval checkpoint

Before making changes, show:

1. Current repository state
2. Exact commands to be executed
3. Exact folders and files that will be created
4. Dependencies that will be installed
5. Important generated files
6. Possible risks or questions

Wait for explicit approval.

## Completion criteria

- `GET /api/health` returns the approved status payload
- `VITE_API_URL` is documented and used by React
- `FRONTEND_ORIGIN` is documented and used for exact-origin CORS
- React displays loading, success, and error states
- Backend unit tests pass
- Backend end-to-end tests pass
- The endpoint works directly
- The local frontend-to-backend flow works
- Backend lint passes
- Frontend lint passes
- Backend build passes
- Frontend build passes
- Missing required configuration fails with an understandable error
- No private configuration is included in the frontend bundle
- No Phase 3 or later functionality is added
- Security impact is reviewed
- No secrets or credentials are added to source
- Environment-variable changes are documented
- `.env.example` files are updated
- `.gitignore` is verified
- Logs are checked for sensitive data
- Dependency/security checks are run where applicable
- Changed files are explained
- Git status is shown
- No commit is created automatically

## Completion record

Phase 2 is in progress. Completion evidence will be recorded only after the
implementation has been verified and reviewed.
