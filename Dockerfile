# syntax=docker/dockerfile:1

# npm runs on the build host architecture (BUILDPLATFORM), never under QEMU
# emulation: node/npm crash there for arm64 ("Illegal instruction" in the V8
# JIT) and the build hangs.
#
# Native modules:
# - better-sqlite3: prebuild-install downloads the prebuilt binary for the
#   target platform (npm_config_arch/platform/libc below). The build fails if
#   the binary does not match the target architecture.
# - bufferutil, utf-8-validate: optional speedups for ws with bundled
#   prebuilds. Without a matching prebuild ws falls back to plain JavaScript.

# Deps stage: production dependencies for the target platform.
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
ARG TARGETARCH

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

RUN case "${TARGETARCH}" in \
        amd64) npm_cpu=x64; elf_machine=62 ;; \
        arm64) npm_cpu=arm64; elf_machine=183 ;; \
        *) echo "unsupported TARGETARCH '${TARGETARCH}'" >&2; exit 1 ;; \
    esac \
    && npm_config_arch="${npm_cpu}" npm_config_platform=linux npm_config_libc=musl \
        npm ci --omit=dev --os=linux --cpu="${npm_cpu}" --no-audit --no-fund \
    && binary=node_modules/better-sqlite3/build/Release/better_sqlite3.node \
    && actual=$(od -An -tu2 -j18 -N2 "${binary}" | tr -d ' ') \
    && if [ "${actual}" != "${elf_machine}" ]; then \
        echo "${binary} has ELF machine ${actual}, expected ${elf_machine} for ${TARGETARCH}" >&2; \
        exit 1; \
    fi \
    && npm cache clean --force

# Production stage - minimal runtime image
FROM node:24-alpine

# Install only runtime dependencies
RUN apk add --no-cache wget

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (includes the target platform binaries)
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /usr/src/app/data /usr/src/app/logs /usr/src/app/public

# Copy application source
COPY . .

# Expose ports
EXPOSE 3000 9090

# Run as non-root user for security
USER node

# Default command
CMD ["npm", "start"]
