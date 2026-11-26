# Deployment

## Docker image (`Dockerfile`)

- Two stages on `node:24-alpine`. Builder installs `python3 make g++ gcc
  libc-dev` and runs `npm ci --production` (compiles `better-sqlite3`).
- Runtime: `apk add wget` (health check), copies `node_modules` from the
  builder, creates `data/`, `logs/`, `public/`, then `COPY . .`.
- `EXPOSE 3000 9090`, `USER node`, `CMD ["npm", "start"]` (runs `start.sh`,
  which registers slash commands on every start, then starts the bot).
- `.dockerignore` excludes `*.md` (except `README.md`), `docs/`, `test/`,
  `.env`, `.env.*`, `Makefile`, `docker-compose.yml`, `.claude/`. It does not
  exclude `data/`, so the tracked `data/tempvoice.db` is copied into the image.

## Compose (`docker-compose.yml`)

| Key | Value |
| --- | --- |
| Service | `bot` |
| Image | `dc-test` (local tag) |
| `env_file` | `.env` |
| Ports | `4000:3000` (dashboard), `${METRICS_PORT:-9090}:9090` |
| Health check | `wget --spider http://localhost:9090/health` |
| Volume | `./data:/usr/src/app/data` |

Both ports are published on all interfaces; the dashboard API has no
authentication.

## CI

Emulation: `docker/setup-qemu-action` is pinned to `tonistiigi/binfmt:qemu-v9.2.2`; with `latest` (QEMU 10) Node crashed with `Illegal instruction` in the arm64 build and the job hung. Job `build-and-push` has `timeout-minutes: 45`.

Triggered on push to `main`, tags `v*.*.*`, pull requests to `main`, manual
dispatch.

| File | Registry | Notes |
| --- | --- | --- |
| `.gitea/workflows/ci.yml` | `${vars.REGISTRY_GITEA}` or `gitea.groot.rocks` | `catthehacker/ubuntu:act-latest` container, `docker:27-dind` service, `linux/amd64,linux/arm64` |
| `.github/workflows/ci.yml` | `ghcr.io` | PR builds `linux/amd64` only, GHA cache |

Jobs: `verify-lockfile` -> `lint`, `test` -> `build-and-push` (no push for
pull requests). Tags: branch, `pr-<n>`, semver `{{version}}` and
`{{major}}.{{minor}}`, `sha-<short>`, `latest` on the default branch.

## Release

No release tooling. A `v*.*.*` tag builds versioned images.
