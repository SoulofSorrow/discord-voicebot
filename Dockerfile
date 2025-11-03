# Build stage - compile native modules
FROM node:20-alpine AS builder

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including native modules)
# Use npm ci for faster, more reliable installs in CI
RUN npm ci --production --ignore-scripts=false

# Production stage - minimal runtime image
FROM node:20-alpine

# Install only runtime dependencies
RUN apk add --no-cache wget

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (includes compiled native modules)
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
