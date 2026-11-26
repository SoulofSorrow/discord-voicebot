---
date: 2026-11-25
type: docs
scope: docs, agent tooling
files: [AGENTS.md, CLAUDE.md, .claude/settings.json, .claude/skills/add-channel-control/SKILL.md, .claude/skills/add-translation/SKILL.md, .claude/skills/add-setting/SKILL.md, .claude/skills/document-change/SKILL.md, docs/README.md, docs/architecture.md, docs/configuration.md, docs/development.md, docs/deployment.md, docs/changes/2026-11-25-ai-ready-docs.md, README.md, .dockerignore]
breaking: false
---
# Agent-ready documentation and project skills

## Context

- The repository had feature guides in the root (`FEATURES.md`,
  `SLASH_COMMANDS.md`, `ADMIN_GUIDE.md`, `DASHBOARD.md`) but no `docs/` folder
  and no instructions for AI coding agents.
- Goal: an agent can find the relevant module, rules and workflow without
  reading the whole codebase.

## Change

- `docs/README.md`: index of topic docs, root feature guides, change records,
  maintenance rules.
- Topic docs describing the current state:
  - `docs/architecture.md`: module map, voice and interaction flows, SQLite
    schema, HTTP servers, invariants.
  - `docs/configuration.md`: every environment variable read in `src/`,
    `config/` and `deploy-commands.js`.
  - `docs/development.md`: npm scripts, ESLint, tests, Makefile targets,
    conventions.
  - `docs/deployment.md`: `Dockerfile`, `docker-compose.yml`, CI workflows.
- `AGENTS.md`: tool-agnostic agent instructions.
- `CLAUDE.md`: imports `AGENTS.md`, Claude Code notes.
- `.claude/settings.json`: allows `npm ci`, `npm run lint`, `npm test`,
  `npx eslint`, `node --test`, read-only `make` targets; asks before
  `git push`, `npm run deploy`, `node deploy-commands.js`, `npm run lint:fix`,
  `npm run deps:update`, `make clean|set-git-local|install-hooks|setup`,
  `docker compose up`; denies reading `.env` and `data/**`.
- `.claude/skills/`: `add-channel-control`, `add-translation`, `add-setting`,
  `document-change`.
- `README.md`: "Documentation" section pointing to `docs/` and `AGENTS.md`.
- `.dockerignore`: added `.claude/` (`*.md` and `docs/` were already
  excluded).

## Decisions

- `AGENTS.md` canonical, `CLAUDE.md` imports it: one source for all agents.
- Root feature guides kept in place and indexed; not moved, to avoid breaking
  links.
- No `release` skill: no release tooling exists; CI builds images from tags.
- `make clean` and `make set-git-local` set to `ask`: they delete config files
  or change the git identity.

## Usage / Verification

```bash
python3 -m json.tool .claude/settings.json
ls docs docs/changes .claude/skills
npm ci && npm run lint && npm test
git checkout -- data/tempvoice.db   # the DB test deletes the tracked file
```

## Follow-ups

- Missing standard files: `CHANGELOG.md`, `CONTRIBUTING.md`,
  `.pre-commit-config.yaml`, `README.de.md`; `Makefile` has no build, test or
  tag targets.
- `data/tempvoice.db` is tracked in git (empty tables at time of writing) and
  copied into the image by `COPY . .`; `data/` is in neither `.gitignore` nor
  `.dockerignore`.
- `test/DatabaseService.test.js` deletes `data/tempvoice.db` in the working
  directory instead of using a temp path.
- Dashboard API (`src/services/DashboardService.js`, including `/api/export`)
  has no authentication and `cors()` without origin restriction;
  `docker-compose.yml` publishes `4000:3000` on all interfaces.
- `public/dashboard.js` opens a WebSocket, but no WebSocket server exists in
  `src/` (`ws` is a dependency but not imported).
- `MAX_TEMP_CHANNELS`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX_REQUESTS`,
  `METRICS_ENDPOINT`, `ERROR_WEBHOOK_URL` are parsed into `config` but not used.
- `src/services/ModalRegistry.js` and `scripts/postinstall` are not wired in.
- `docker-compose.yml` uses image `dc-test` instead of a registry image.
- Makefile hardcodes a git identity and an e-mail address.
- Locally (Node 26) `better-sqlite3` failed to compile; CI uses Node 22.
