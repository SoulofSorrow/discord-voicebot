# Documentation Index

Primary reader: AI coding agents. Human readers start with `README.md`.

Read this index first, then the topic docs that match the area you change.
Agent rules and workflow live in `AGENTS.md` in the repository root.

## Topic docs (current state)

| File | Purpose |
| --- | --- |
| `docs/architecture.md` | Components, module map, voice/interaction/startup flows, SQLite schema, HTTP servers, invariants |
| `docs/configuration.md` | Every environment variable, defaults, where it is read |
| `docs/development.md` | Setup, npm scripts, ESLint, `node:test`, conventions |
| `docs/deployment.md` | Dockerfile, `docker-compose.yml`, `start.sh`, CI workflows, image tags |

## Feature guides (root, human-oriented)

| File | Content |
| --- | --- |
| `FEATURES.md` | Feature list v2.0 |
| `SLASH_COMMANDS.md` | `/admin` subcommands |
| `ADMIN_GUIDE.md` | Admin functions (German) |
| `DASHBOARD.md` | Web analytics dashboard |

## Change records

One file per change set in `docs/changes/`, named `YYYY-MM-DD-<short-slug>.md`.
Never rewrite an existing change file; add a new one.

| File | Purpose |
| --- | --- |
| `docs/changes/2026-11-25-ai-ready-docs.md` | Adds `docs/`, `AGENTS.md`, `CLAUDE.md` and project skills |
| `docs/changes/2026-11-26-registry-login-packages-token.md` | Registry login uses the shared `PACKAGES_TOKEN` |

## Maintenance rules

- Add, rename or remove a doc: update this index in the same change.
- Change behaviour: update the affected topic doc in the same change.
- Every change set: add a file in `docs/changes/` and list it above.
