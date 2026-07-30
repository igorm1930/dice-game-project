# Skill Routing Policy

## Purpose

Use installed Codex skills when they provide a defined workflow that matches
the current task.

Skills support the project workflow; they do not override project decisions,
the current phase, existing code, tests, or user approval requirements.

## Required skill check

Before beginning any task, the agent must:

1. Read `AGENTS.md`.
2. Read `PROJECT_DECISIONS.md`.
3. Read `PROJECT_ROADMAP.md`.
4. Read `PROJECT_CHECKLIST.md`, when present.
5. Read `CURRENT_PHASE.md`.
6. Inspect the repository and Git status.
7. Inspect the skills and plugins currently available in the session.
8. Compare the task against the routing table below.
9. State which skill or skills are relevant.
10. Explain why each selected skill applies.
11. State when no suitable skill is available.
12. Wait for approval before making changes.

Never claim that a skill was used unless it was actually available and invoked.

## Authority order

When a skill conflicts with project instructions, follow this order:

1. Original interview assignment
2. `PROJECT_DECISIONS.md`
3. `CURRENT_PHASE.md`
4. Existing verified code and tests
5. `PROJECT_ROADMAP.md`
6. `PROJECT_CHECKLIST.md`
7. `docs/skill-routing.md`
8. Skill guidance
9. General AI recommendation

A skill may improve execution, but it may not change approved scope,
architecture, technology choices, or game rules.

## Routing table

### CI Debug

Use when:

- a GitHub Actions workflow fails
- a CI test fails but passes locally
- a CI build, lint, dependency-installation, or environment step fails
- the user explicitly asks to investigate a failed workflow

Do not use when:

- creating the first CI workflow
- CI is green
- the task is an ordinary local test failure
- no workflow run exists

Required output:

- failed workflow and job
- failing step
- relevant log evidence
- root-cause hypothesis
- smallest proposed correction
- verification plan

Do not modify code before presenting the failure analysis.

### Review Follow-up

Use when:

- a pull request has reviewer comments
- requested changes need to be implemented
- review threads must be answered or resolved
- the user asks to address PR feedback

Do not use for:

- the initial self-review before a pull request exists
- general code explanation
- unrelated refactoring

Required output:

- every review comment found
- classification: accepted, questioned, or already resolved
- files affected by each comment
- proposed response and code change
- verification required
- unresolved review threads

Do not silently ignore a reviewer comment.

### Code Review

Use when:

- a phase implementation is complete
- a pull request is ready for review
- the user asks for a code-quality or correctness review
- a security-sensitive change needs a second pass

Review for:

- assignment compliance
- correctness
- architecture boundaries
- game logic accidentally placed in React
- authentication and authorization problems
- input validation
- test coverage
- error handling
- unnecessary complexity
- dead or generated-looking code
- documentation accuracy

A review must report findings before applying fixes unless the user explicitly
approved automatic remediation.

### Pull Request Preparation

Use when:

- a phase is verified and ready for a pull request
- the user asks to create or prepare a PR
- the branch needs a summary and testing evidence

Required output:

- concise title
- implementation summary
- files or areas changed
- tests and builds actually run
- screenshots when UI changed
- known limitations
- checklist linkage
- relevant decisions

Never claim tests were run when they were not.

### Issue Investigation

Use when:

- a defect is reported
- behavior differs from requirements
- an unexpected API or UI result must be reproduced
- a regression is suspected

Required order:

1. Reproduce
2. Gather evidence
3. Identify affected layer
4. Explain likely cause
5. Propose the smallest fix
6. Add or update a regression test
7. Verify the fix

Do not begin by rewriting code without reproduction evidence.

### Test Generation or Test Review

Use when:

- a new business rule is implemented
- an endpoint is introduced
- authentication or authorization changes
- a regression test is required
- the current phase explicitly requires tests

The skill must not invent requirements.

Tests must be based on:

- assignment requirements
- approved decisions
- implemented API contracts
- existing behavior intentionally preserved

### Security Review

Use when:

- authentication is introduced or changed
- JWT handling changes
- passwords or secrets are handled
- authorization rules change
- user-controlled identifiers are processed
- deployment or environment secrets are configured

Review at minimum:

- password storage
- token verification
- secret handling
- object-level authorization
- client-supplied identity
- input validation
- information leakage
- committed secrets

### Documentation Update

Use when:

- an implementation phase is completed
- API behavior changes
- architecture changes
- a new decision is approved
- setup or deployment commands change

Documentation must describe verified reality, not planned or assumed behavior.

## Multi-agent routing

Use a single implementation agent by default.

Parallel agents are appropriate when:

- work is independent
- file ownership does not overlap
- interfaces are already agreed
- each result can be tested separately
- integration order is known

Prefer parallel review agents over parallel coding agents.

Good specialist roles:

- requirements reviewer
- test-case designer
- security reviewer
- CI reviewer
- accessibility reviewer
- documentation reviewer

Do not use multi-agent implementation when:

- scaffolding the project
- choosing shared architecture
- editing root configuration
- changing shared contracts
- implementing tightly coupled frontend and backend behavior
- the developer is still learning the generated structure

## Multiple-skill tasks

More than one skill may be useful.

Recommended order:

1. Investigation skill
2. Domain-specific implementation skill
3. Test skill
4. Review skill
5. Documentation or PR skill

Example for failed CI after responding to a review:

1. Review Follow-up
2. CI Debug
3. Test Review
4. Pull Request Preparation

Do not invoke multiple skills merely because they exist.

## Skill availability

If the matching skill is unavailable:

1. State that it is unavailable.
2. Do not pretend it was used.
3. Follow the same workflow manually.
4. Record the missing skill as a limitation.
5. Continue only when the task can be completed safely without it.

## Skill execution report

Before implementation, report:

```text
Skill check:
- Available relevant skills:
- Selected skills:
- Reason:
- Skills considered but not selected:
- Missing expected skills:
```
