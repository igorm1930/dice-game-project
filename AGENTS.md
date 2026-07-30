# AI Agent Instructions

## Purpose

This project is built incrementally so the developer can understand, review, test, and approve every meaningful change.

The AI must not build the entire application in one request.

## Required reading order

Before doing any work:

1. Read `PROJECT_DECISIONS.md`.
2. Read `PROJECT_ROADMAP.md`.
3. Read `CURRENT_PHASE.md`.
4. Read `docs/assignment-requirements.md`.
5. Inspect the existing repository.
6. Inspect `git status`.
7. Do not assume that a planned feature already exists.

## Source-of-truth priority

Use this priority when instructions appear to conflict:

1. Original interview assignment
2. `PROJECT_DECISIONS.md`
3. `CURRENT_PHASE.md`
4. Existing verified code and tests
5. `PROJECT_ROADMAP.md`
6. Session logs
7. AI suggestions

Do not override an approved decision without explicit user approval.

## Work process

For every task:

1. Explain the goal in plain language.
2. Inspect the relevant files.
3. List all files that will be created or modified.
4. List all commands that will be executed.
5. Explain any dependency that may be installed.
6. Identify risks, assumptions, or ambiguities.
7. Wait for user approval before making changes.
8. Implement only the approved current phase.
9. Do not modify unrelated files.
10. Run relevant tests, lint, and builds.
11. Report exact commands and exact results.
12. Clearly state anything that was not verified.
13. Stop after the current phase.
14. Do not automatically continue to the next phase.
15. Do not commit or push unless explicitly requested.

## Safety rules

- Never delete files without explicit approval.
- Never rewrite Git history.
- Never run `git reset --hard`.
- Never force-push.
- Never commit secrets.
- Never expose environment-variable secrets.
- Never edit real `.env` values unless explicitly approved.
- Never install a dependency without explaining why.
- Never claim a command succeeded unless it was actually executed.
- Never claim tests passed unless they were actually executed.
- Never claim a feature exists unless it exists in the repository.
- Never silently change the approved stack.
- Never silently change architecture decisions.
- Never implement a later roadmap phase early.
- Never implement game logic in React.
- Never trust client-supplied user identity, player identity, dice values, scores, turns, winner state, or allowed actions.
- Never generate dice in the frontend.
- Never store authoritative game state in browser storage.

## Verification requirements

Before declaring a phase complete:

- run relevant tests
- run lint when available
- run builds
- manually verify the required behavior when applicable
- show exact command output summaries
- list files changed
- explain important code
- identify unverified behavior

## Git policy

- Use small, meaningful commits.
- One commit should represent one logical change.
- Do not create one large generated commit for the whole application.
- Do not commit automatically.
- Before proposing a commit, show `git status` and summarize the diff.

## Documentation policy

After a phase is completed and approved:

- update `CURRENT_PHASE.md`
- create or update a session log under `docs/session-log/`
- update `PROJECT_DECISIONS.md` only when a real decision changes
- update `docs/api-contracts.md` only for implemented endpoints
- update `docs/architecture.md` only for implemented architecture
- update `docs/testing-strategy.md` only for tests that exist

Do not document planned features as if they are already implemented.
