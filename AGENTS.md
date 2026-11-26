# AGENTS.md

Instructions for AI coding agents working in this repository. Tool-agnostic;
`CLAUDE.md` imports this file.

## Project

TempVoice v2 (`package.json` name `tempvoice`): Discord bot for temporary voice
channels in one guild. A member joins the "join to create" voice channel, the
bot creates a personal channel in a category and the owner controls it through
buttons, select menus and modals on a dashboard embed. Includes `/admin`
commands, SQLite persistence, Prometheus metrics and a web analytics dashboard.

Stack: Node.js ES modules (`"type": "module"`), `discord.js` 14,
`better-sqlite3` (native), `express` 5, `prom-client`, `@sentry/node`,
ESLint 9, `node:test`. License MIT (`LICENSE`).

## Read first

1. `docs/README.md` (index).
2. The topic doc for the area you touch:

| Area | Doc |
| --- | --- |
| Overall structure, module map, flows, SQLite schema | `docs/architecture.md` |
| Environment variables | `docs/configuration.md` |
| Setup, lint, tests, conventions | `docs/development.md` |
| Docker image, compose, CI workflows | `docs/deployment.md` |

Older human-oriented guides in the root (`FEATURES.md`, `SLASH_COMMANDS.md`,
`ADMIN_GUIDE.md` in German, `DASHBOARD.md`) describe features; the code wins
where they disagree.

## Commands

```bash
npm ci               # install (better-sqlite3 compiles natively)
npm run lint         # eslint .
npm test             # node --test 'test/*.test.js'
npm run dev          # node --watch src/index.js
npm start            # ./start.sh: deploy-commands.js, then src/index.js
npm run deploy       # register slash commands for GUILD_ID (calls Discord API)
```

Single test file: `node --test test/Sanitizer.test.js`.

## Definition of done

- `npm run lint` and `npm test` pass (CI runs both on Gitea and GitHub).
- New logic in `src/utils/` or `src/services/` has a test in `test/`.
- Affected topic doc in `docs/` updated.
- New file `docs/changes/YYYY-MM-DD-<slug>.md` (template in
  `.claude/skills/document-change/SKILL.md`), listed in `docs/README.md`.
- New user-facing text: key added to every file in `language/`.
- `package.json` changed: `package-lock.json` updated in the same commit (CI job
  `verify-lockfile`).

## Hard rules

- Never commit `.env`, tokens, Sentry DSNs or webhook URLs. `env.example`
  holds empty placeholders only.
- `npm test` (`test/DatabaseService.test.js`) deletes and recreates
  `data/tempvoice.db` in the working directory. Never run tests in a directory
  that holds a real database.
- Every channel control checks ownership with `OwnershipManager.check()` before
  acting. `/admin` actions check `AdminService.isAdmin()`.
- User input from modals goes through `ValidationService` / `Sanitizer`.
- Ownership lives in two places that must stay in sync: `client.tempVoiceOwners`
  (memory) and table `channels` (SQLite). Use `OwnershipManager` methods, not
  direct writes.
- Dashboard button `customId`s (`name`, `limit`, `privacy`, `dnd`, `preset`,
  `trust`, `untrust`, `block`, `unblock`, `bitrate`, `invite`, `kick`, `claim`,
  `transfer`, `delete`) equal modal file names in `src/modals/`; renaming one
  breaks the posted dashboard and the routing.
- New temp channels are named `<username> - room`; startup cleanup in
  `src/events/ready.js` deletes empty channels in the category whose name ends
  with ` - room`. Keep the suffix.
- Event handlers and modals catch errors via `ErrorHandler.handle()`; one
  failing interaction must not crash the process.
- Do not run `make clean` (deletes `.editorconfig`, `.gitignore`,
  `.dockerignore`) or `make set-git-local` / `make install-hooks` (change git
  config and hooks) unless the user asks.
- Do not push to `main`, push `v*.*.*` tags or run `npm run deploy` unless the
  user asks.
- No new emojis in code comments, logs or docs.

## Language

| Artifact | Language |
| --- | --- |
| Code, identifiers | English |
| Comments | Mixed English/German in existing code; write new ones in English |
| Bot texts | Via `t(key, lang)` from `language/<lang>.js` (`en`, `de`, `cn`, `id`, `jp`, `ru`) |
| Commit messages, `docs/` | English |

Commits: Conventional Commits, imperative, no tool attribution trailers.

## Project skills

Located in `.claude/skills/<name>/SKILL.md`.

| Skill | Use for |
| --- | --- |
| `add-channel-control` | New dashboard button plus modal/select handler |
| `add-translation` | New or changed bot text in `language/` |
| `add-setting` | New environment variable |
| `document-change` | Writing the `docs/changes/` record |
