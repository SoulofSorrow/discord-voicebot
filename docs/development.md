# Development

## Prerequisites

- Node.js `>=18.0.0` per `engines`; CI uses Node 22, the image Node 24.
- Build tools for `better-sqlite3` if no prebuilt binary exists for the local
  Node version (Python 3, make, a C++ compiler).

## npm scripts (`package.json`)

| Command | Effect |
| --- | --- |
| `npm ci` | Install from `package-lock.json` |
| `npm start` | `./start.sh` (deploy commands, then `node src/index.js`) |
| `npm run start:direct` | `node src/index.js` |
| `npm run dev` | `node --watch src/index.js` |
| `npm run deploy` | `node deploy-commands.js` (Discord API call) |
| `npm run lint` / `npm run lint:fix` | `eslint .` / with `--fix` |
| `npm test` | `node --test 'test/*.test.js'` |
| `npm run security` | `npm audit` |
| `npm run deps:check` / `deps:update` | `npm outdated` / `npx npm-check-updates -u` |
| `npm run docker:build` / `docker:run` | `docker build -t tempvoice .` / run with `--env-file .env` |

## Lint

`eslint.config.js`: all `**/*.js`, ES modules, `ecmaVersion: 'latest'`, no
custom rules, `reportUnusedDisableDirectives`.

## Tests

- `test/CacheManager.test.js`, `test/DatabaseService.test.js`,
  `test/Sanitizer.test.js`, `test/ValidationService.test.js`.
- `test/DatabaseService.test.js` deletes and recreates
  `data/tempvoice.db` relative to the working directory. Run tests only in a
  checkout without real data. `data/tempvoice.db` is tracked in git, so
  restore it afterwards with `git checkout -- data/tempvoice.db` if the test
  removed or changed it.
- Discord interactions, voice events and HTTP servers are not tested.

## Makefile

Only repository-setup targets: `help`, `setup`, `install-editorconfig`,
`install-gitignore`, `install-dockerignore`, `install-hooks`, `set-git-local`,
`check-git`, `test-hook`, `info`, `clean`. No build or test targets. `clean`
deletes `.editorconfig`, `.gitignore`, `.dockerignore` and the pre-commit
hook; `set-git-local` overwrites the local git identity.

## Conventions

- `.editorconfig`: UTF-8, LF, 2-space indent, max line length 160.
- Ephemeral replies use `flags: MessageFlags.Ephemeral`.
- Text through `t(key, config.language, values)`; never inline user-facing
  strings.
- `scripts/postinstall` exists but is not wired into `package.json`.
