---
date: 2026-11-26
type: fix
scope: Dockerfile
files: [Dockerfile, docs/deployment.md, docs/README.md, docs/changes/2026-11-26-npm-on-build-platform.md]
breaking: false
---
# Run npm on the build platform, not under QEMU

## Context
- The arm64 image build ran `node`/`npm` under QEMU user emulation.
- Node crashed with `qemu: uncaught target signal 4 (Illegal instruction) - core dumped` during `npm ci` / `npm install`, and the job hung until `timeout-minutes`.
- Pinning `docker/setup-qemu-action` to `tonistiigi/binfmt:qemu-v9.2.2` did not fix it (same crash on `main` after the pin).

## Change
- `Dockerfile`: every stage that runs `npm` uses `FROM --platform=$BUILDPLATFORM`, so it runs natively on the runner.
- `Dockerfile`: the runtime stage (target platform) copies `node_modules` from that stage and runs no `npm` command.
- Native dependencies: `better-sqlite3`: `prebuild-install` downloads the target prebuild via `npm_config_arch`, `npm_config_platform=linux`, `npm_config_libc=musl`; build fails if the ELF machine of `better_sqlite3.node` does not match `TARGETARCH`. `bufferutil` / `utf-8-validate`: no linux-arm64 prebuild, `ws` uses its JavaScript fallback on arm64. Compiler toolchain (`python3 make g++ gcc libc-dev`) removed from the builder.
- `docs/deployment.md`: image stages and the emulation note describe the new layout.
- CI workflow unchanged; the QEMU pin stays because runtime-stage `RUN` steps (for example `apk add`) still run emulated.

## Decisions
- Build-platform `npm` with target-specific prebuilds: keeps `linux/arm64` and removes Node from emulation.
- Rejected: drop `linux/arm64` (loses the platform).
- Rejected: native arm64 runner (none available).
- Rejected: other QEMU versions (crash also with 9.2.2; no reliable version known).

## Usage / Verification
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t local/discord-voicebot:test .
```
- In CI: job `Build & Push` of `.gitea/workflows/ci.yml` must finish both platforms without `Illegal instruction`.

## Follow-ups
- A new dependency with a native binary must be installed for the target platform in the build-platform stage (`npm ci --os/--cpu`, prebuild settings) and checked; host binaries do not run on other architectures.
