# Deployment

## Docker image (`Dockerfile`)

- Two stages on `node:24-alpine`. Builder (`--platform=$BUILDPLATFORM`) runs
  `npm ci --omit=dev --os=linux --cpu=<target>` with `npm_config_arch`,
  `npm_config_platform=linux`, `npm_config_libc=musl`: `better-sqlite3` gets
  the target prebuild via `prebuild-install`, no compiler. The build fails if
  `better_sqlite3.node` has the wrong ELF machine. `bufferutil` and
  `utf-8-validate` have no linux-arm64 prebuild; on arm64 `ws` uses its
  JavaScript fallback.
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

Emulation: node/npm never run under QEMU. Every `npm` stage of the `Dockerfile` uses `FROM --platform=$BUILDPLATFORM`; only the runtime stage is built for the target platform. Under emulation Node crashed with `Illegal instruction` in the arm64 build and the job hung, with QEMU 10 and with the pinned `tonistiigi/binfmt:qemu-v9.2.2` (pin kept). Job `build-and-push` has `timeout-minutes: 45`.

Triggered on push to `main`, tags `v*.*.*`, pull requests to `main`, manual
dispatch.

| File | Registry | Notes |
| --- | --- | --- |
| `.gitea/workflows/ci.yml` | `${vars.REGISTRY_GITEA}` or `gitea.groot.rocks` | `catthehacker/ubuntu:act-latest` container, `docker:27-dind` service, `linux/amd64,linux/arm64` |
| `.github/workflows/ci.yml` | `ghcr.io` | PR builds `linux/amd64` only, GHA cache |

Jobs: `verify-lockfile` -> `lint`, `test` -> `build-and-push` (no push for
pull requests). Tags: every pushed build gets `sha-<short>` (also pushes to `main`); a release tag `vX.Y.Z` additionally pushes `X.Y.Z` and `latest`; a prerelease tag pushes its version without `latest`; no branch or floating tags; pull requests build without pushing.

## Release

No release tooling. A `v*.*.*` tag builds versioned images.
