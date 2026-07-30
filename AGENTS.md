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
5. Read `docs/skill-routing.md`.
6. Inspect the existing repository.
7. Inspect `git status`.
8. Do not assume that a planned feature already exists.

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

## Skill discovery and routing

Before each task:

1. Inspect the skills and plugins available in the current session.
2. Select only skills whose documented trigger conditions match the current task.
3. Follow `docs/skill-routing.md`.
4. State which skills will be used and why.
5. If no suitable skill is available, say so and continue using the normal workflow.

Never claim that an unavailable or uninvoked skill was used.

## MCP routing

Before using an MCP server, read `docs/mcp-routing.md`.

Use MCP only for tasks requiring access to external systems or specialized
tools.

Prefer local tools for local files, builds, tests, and Git inspection.

Before MCP use, report:

- server
- tools
- purpose
- read or write capability
- approval requirement

All external write operations require explicit approval.

Skills define the workflow; MCP provides external access. When both apply,
select the skill first and then use the smallest MCP toolset required by that
skill.

This is the rule we should remember:

Task trigger
→ choose skill
→ skill defines procedure
→ choose MCP server if external access is required
→ use minimum permissions
→ report evidence
→ request approval for writes

Examples:

GitHub Actions failed
→ CI Debug skill
→ GitHub MCP Actions
→ read logs
→ propose fix
Reviewer requested changes
→ Review Follow-up skill
→ GitHub MCP Pull Requests
→ retrieve comments
→ map and address feedback
Need to implement Hold rule
→ game-engine workflow
→ no MCP required
→ local code and tests

## Multi-agent workflow

Default to one active implementation agent.

Use multiple agents only when tasks are independent and have clearly separated
outputs or file ownership.

Before starting multi-agent work, define for each agent:

- role
- exact task
- files it may modify
- files it must not modify
- expected output
- dependency on other agents
- merge order

Only one agent may modify a given file or shared configuration area at a time.

Review, testing, security, and documentation agents should default to
read-only analysis and findings.

Do not run parallel implementation agents during early sequential phases.

Before merging agent work:

1. Review each diff independently.
2. Confirm no overlapping changes.
3. Run the full relevant test suite.
4. Resolve conflicts manually.
5. Update documentation and checklist.
6. Commit only verified integrated work.

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

## Branch policy

- Never implement project phases directly on `main`.
- Create one short-lived branch for each roadmap phase.
- Branch naming format: `phase/NN-short-description`.
- Start each phase branch from the latest `main`.
- Do not mix multiple phases in one branch.
- Push the phase branch only after local verification.
- Open a pull request into `main`.
- Merge only after review and successful required checks.
- Delete the phase branch after merge.
- Direct commits to `main` are allowed only for trivial documentation corrections explicitly approved by the user.

## Security policy

Before every task, read `docs/security-policy.md`.

For each proposed change, report:

- configuration values introduced
- whether each value is public or secret
- where each value will be stored
- whether `.gitignore` needs updating
- new user-controlled input
- authentication or authorization impact
- required security checks

Never:

- hardcode credentials
- place secrets in frontend code
- place secrets in `VITE_*` variables
- commit real `.env` files
- print secrets in logs
- weaken CORS, authentication, authorization, or CI permissions without
  explicit approval

Security-sensitive phases require an explicit security review before
completion.

## Documentation policy

After a phase is completed and approved:

- update `CURRENT_PHASE.md`
- create or update a session log under `docs/session-log/`
- update `PROJECT_DECISIONS.md` only when a real decision changes
- update `docs/api-contracts.md` only for implemented endpoints
- update `docs/architecture.md` only for implemented architecture
- update `docs/testing-strategy.md` only for tests that exist

Do not document planned features as if they are already implemented.
