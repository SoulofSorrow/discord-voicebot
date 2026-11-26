# Configuration

Environment variables, loaded with `dotenv` (`import 'dotenv/config'`).
Template: `env.example` (copy to `.env`). `config/config.js` merges a subset
into a config object; other modules read `process.env` directly.

## Discord (required)

| Variable | Read in | Purpose |
| --- | --- | --- |
| `DISCORD_TOKEN` | `src/index.js`, `deploy-commands.js` | Bot token; start fails without it |
| `GUILD_ID` | `src/index.js`, `src/events/ready.js`, `deploy-commands.js`, `src/utils/embedBuilder.js` | The one guild the bot serves |
| `CLIENT_ID` | `deploy-commands.js` | Application ID for command registration |
| `CATEGORY_CHANNEL_ID` | `src/events/ready.js`, `src/services/VoiceChannelService.js`, `src/services/AdminService.js`, `src/events/channelUpdate.js`, `src/utils/ValidationService.js` | Category for temp channels |
| `EMBED_CHANNEL_ID` | `src/events/ready.js` | Text channel for the control dashboard |
| `VOICE_CHANNEL_ID` | `src/events/ready.js`, `src/services/VoiceChannelService.js`, `src/utils/embedBuilder.js` | "Join to create" channel |
| `LOG_CHANNEL_ID` | `src/events/ready.js`, `src/utils/logger.js` | Optional text channel for action logs |

## Bot settings (optional)

| Variable | Default | Read in | Purpose |
| --- | --- | --- | --- |
| `BOT_LANGUAGE` | `en` | `config/config.js` | `en`, `de`, `cn`, `id`, `jp`, `ru`; invalid falls back to `en` |
| `BOT_LABEL` | `TempVoice` | `config/config.js` | Label in console log lines |
| `EMBED_COLOR` | `#2f3136` | `config/config.js` | Embed colour, must match `#RRGGBB` |
| `ENABLE_LOGGING` | `true` | `config/config.js` | `false` disables `log()` messages |
| `BANNER_URL` | built-in fallback | `src/utils/embedBuilder.js` | Dashboard embed image |
| `USE_UNICODE_EMOJI` | `false` unless `true` | `src/handlers/embedSender.js`, `src/utils/embedBuilder.js` | Unicode emoji instead of custom emoji IDs on buttons |
| `SETTING_EMOJI_ID` | unset | `src/utils/embedBuilder.js` | Custom emoji ID in the embed; not in `env.example` |
| `MAX_TEMP_CHANNELS` | unset | `config/config.js` | Parsed into `config.maxTempChannels` |
| `RATE_LIMIT_WINDOW` | unset | `config/config.js` | Parsed into `config.rateLimitWindow` |
| `RATE_LIMIT_MAX_REQUESTS` | unset | `config/config.js` | Parsed into `config.rateLimitMaxRequests` |
| `DEBUG_MODE` | `false` | `config/config.js` | `true` prints the merged config at start |

`MAX_TEMP_CHANNELS`, `RATE_LIMIT_WINDOW` and `RATE_LIMIT_MAX_REQUESTS` are
parsed but the interaction rate limit in `src/events/interactionCreate.js` is
hardcoded (10 per 60000 ms).

## Monitoring and dashboard (optional)

| Variable | Default | Read in | Purpose |
| --- | --- | --- | --- |
| `METRICS_PORT` | `9090` | `src/services/MonitoringService.js`, `docker-compose.yml` | `/metrics`, `/health`, `/ready` |
| `ENABLE_DASHBOARD` | enabled unless `false` | `src/core/initializeBot.js` | Express dashboard |
| `DASHBOARD_PORT` | `3000` | `src/services/DashboardService.js` | Dashboard port |
| `SENTRY_DSN` | unset | `src/utils/ErrorHandler.js` | Enables Sentry error reporting |
| `NODE_ENV` | `production` (Sentry), `development` (logger) | `src/utils/ErrorHandler.js`, `src/utils/StructuredLogger.js` | Environment label |
| `LOG_LEVEL` | `info` | `src/utils/StructuredLogger.js` | Minimum log level |
| `LOG_FORMAT` | text | `src/utils/StructuredLogger.js` | `json` for JSON log lines |
| `METRICS_ENDPOINT` | unset | `config/config.js` | Stored in config; no other reader in `src/` |
| `ERROR_WEBHOOK_URL` | unset | `config/config.js` | Stored in config; no other reader in `src/` |

## Rules

- Secrets (`DISCORD_TOKEN`, `SENTRY_DSN`, webhook URLs) only in `.env` or a
  secret store, never in code or `env.example`.
- New variables: add to `env.example` with a comment and to this file.
