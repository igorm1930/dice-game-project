# Testing Strategy

## Status

Only generated project tests are expected during Phase 1.

The full testing strategy will grow incrementally.

## Testing principles

- Test every phase before continuing.
- Keep tests deterministic.
- Do not use production databases in tests.
- Do not claim tests passed unless they were executed.
- Report exact commands.
- Report failures honestly.
- Prefer testing behavior over implementation details.
- Game-rule tests must not depend on random values.
- Backend rule tests must not require React.
- Frontend tests must not duplicate game rules.

## Planned test levels

### Backend unit tests

For:

- isolated services
- validation helpers
- pure game engine
- deterministic dice behavior

### Backend integration tests

For:

- controllers
- authentication
- MongoDB repositories
- authorization
- API error handling

### Frontend component tests

For:

- loading states
- success states
- errors
- forms
- server-state rendering
- active-seat behavior

### End-to-end verification

For:

- browser to API
- API to MongoDB
- authentication
- two-user simulation
- complete game flow

## Current tests

None beyond project-generated tests.

Update this section only after tests are implemented.
