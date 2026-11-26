---
name: add-setting
description: Add a new environment variable to TempVoice (config/config.js or direct process.env read, env.example, docs). Use when a feature needs a configurable value.
---

# Add an environment variable

Background: `docs/configuration.md`.

## Steps

1. **Read**:
   - Bot behaviour: add a key to `envOverrides` in `config/config.js` (parse
     numbers with `parseInt`, booleans by comparing to `'true'`/`'false'`) and
     a default in `defaultConfig` if needed. Validate in the same file with a
     warning and fallback, like `language` and `embedcode`.
   - Infrastructure (ports, IDs): read `process.env.NAME` with a default in
     the module, as `METRICS_PORT` in `src/services/MonitoringService.js`.
2. **Required variables**: check at start in `src/index.js` and throw a clear
   error.
3. **Template**: add to `env.example` under the matching section, empty value
   for secrets.
4. **Compose**: `docker-compose.yml` loads `.env`; edit it only for ports or
   volumes.
5. **Docs**: row in `docs/configuration.md`; README configuration block if
   users must set it; then the `document-change` skill.
6. Run `npm run lint` and `npm test`.

## Rules

- Never hardcode secrets or real-looking example values.
- A new required variable is a breaking change: `breaking: true` in the change
  file.
