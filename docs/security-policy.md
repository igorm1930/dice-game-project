# Project Security Policy

## Core principles

- No secrets in source code.
- No secrets in committed environment files.
- No backend secrets exposed to React.
- All configuration is validated at startup.
- Use least privilege for GitHub Actions, MongoDB, and deployment credentials.
- Treat all client input as untrusted.
- Authentication does not replace authorization.
- Security checks apply to every phase.

## Frontend configuration

Only public configuration may use the `VITE_` prefix.

Allowed examples:

- `VITE_API_URL`
- public application name
- public feature flags

Forbidden examples:

- JWT signing secrets
- database credentials
- private API keys
- service-account tokens
- GitHub tokens

## Backend configuration

Backend secrets must come from runtime environment variables or an approved
secret manager.

Required sensitive variables must never have production fallback values in
source code.

## Repository rules

The following must not be committed:

- `.env`
- `.env.local`
- `.env.*.local`
- private keys
- access tokens
- database credentials
- production certificates
- cloud-provider credentials

Only `.env.example` files containing placeholders may be committed.

## CI/CD rules

- Store secrets in GitHub Actions secrets or environment secrets.
- Use least-privilege workflow permissions.
- Do not echo secrets.
- Do not embed credentials in workflow YAML.
- Run dependency and secret checks.
- Require passing checks before merge.

## Required security review triggers

Run a security review when:

- configuration handling changes
- a database connection is introduced
- user input is persisted
- authentication is introduced or changed
- authorization changes
- deployment is configured
- CI permissions change
- dependencies with security impact are added
