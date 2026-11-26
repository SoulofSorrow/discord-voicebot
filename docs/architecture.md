# Architecture

## Summary

- Single Node.js process (ES modules), entry point `src/index.js`, normally
  started through `start.sh` (registers slash commands first).
- One guild only: `GUILD_ID`, with a category (`CATEGORY_CHANNEL_ID`), a
  dashboard text channel (`EMBED_CHANNEL_ID`), a "join to create" voice channel
  (`VOICE_CHANNEL_ID`) and an optional log channel (`LOG_CHANNEL_ID`).
- Storage: SQLite `data/tempvoice.db` (relative to the working directory) via
  `better-sqlite3`, WAL mode.
- Two HTTP servers in the same process: Prometheus/health on `METRICS_PORT`
  (default 9090) and the Express analytics dashboard on `DASHBOARD_PORT`
  (default 3000, disabled with `ENABLE_DASHBOARD=false`).

## Module map

| Path | Responsibility |
| --- | --- |
| `src/index.js` | Client with intents `Guilds`, `GuildMessages`, `GuildVoiceStates`, `MessageContent`; env check (`DISCORD_TOKEN`, `GUILD_ID`); `initializeBot()`; login |
| `src/core/initializeBot.js` | DB init, client collections, ownership restore, command and modal loading, event wiring, 10-minute cleanup interval, monitoring and dashboard start, signal handlers |
| `src/events/ready.js` | Validates configured channels (exits on invalid), caches them, posts the dashboard embed, deletes orphaned empty `* - room` channels |
| `src/events/voiceStateUpdate.js` | Dispatches join/leave/switch to `VoiceChannelService` |
| `src/events/interactionCreate.js` | `InteractionHandler`: slash commands, rate limit, buttons, modals, string and user select menus |
| `src/events/channelUpdate.js` | Voice channel renames and permission changes not made via a modal are logged |
| `src/handlers/embedSender.js` | Posts or edits the dashboard embed with the control buttons; removes duplicate bot messages |
| `src/modals/*.js` | One handler per control (`customId` = file name); default export `{ execute(interaction, client, config) }`, optional `aliases` |
| `src/commands/admin.js` | `/admin` with subcommands `stats`, `cleanup`, `clear-cache`, `reload-config`, `force-delete`, `force-transfer`, `reset-ratelimit`, `user`, `export-db`; default member permission `Administrator`, plus `AdminService.isAdmin()` check |
| `src/services/VoiceChannelService.js` | Create temp channel on join, delete when owner leaves and channel is empty |
| `src/services/DatabaseService.js` | Singleton; schema, channel/permission/metric CRUD, `cleanupOldMetrics()`, `transaction()` |
| `src/services/AdminService.js` | `isAdmin()` and privileged operations |
| `src/services/PresetService.js` | Channel presets (`default`, `vip`, ...) and access checks |
| `src/services/MonitoringService.js` | Plain `http` server: `/metrics`, `/health`, `/ready` |
| `src/services/DashboardService.js` | Express app: static `public/`, `/api/dashboard`, `/api/channels`, `/api/users`, `/api/performance`, `/api/timeline`, `/api/errors`, `/api/health`, `/api/export`; `express-rate-limit` |
| `src/services/AnalyticsService.js` | Aggregations for the dashboard API |
| `src/services/ModalRegistry.js` | Registry class; not imported elsewhere in `src/` |
| `src/utils/OwnershipManager.js` | `check()`, `register()`, `transfer()`, `cleanup()`; memory map plus DB |
| `src/utils/ValidationService.js`, `src/utils/Sanitizer.js` | Input validation and sanitising |
| `src/utils/RateLimiter.js`, `CacheManager.js`, `LRUCache.js`, `MetricsCollector.js` | Rate limits, caches, in-process counters |
| `src/utils/ErrorHandler.js` | Central error handling, Sentry when `SENTRY_DSN` is set |
| `src/utils/logger.js` | `logStartup()` (console), `log(key, client, data)` (translated message to `LOG_CHANNEL_ID`) |
| `src/utils/StructuredLogger.js` | Levelled logger, JSON with `LOG_FORMAT=json` |
| `src/utils/t.js` | `t(key, lang, values)` with fallback to `en`, then the key |
| `src/constants.js` | Permission names, `MODAL_ACTIONS`, privacy options, regions, bitrate and limit presets |
| `config/config.js` | Merges env overrides into defaults, validates language and embed colour |
| `language/*.js` | Translations `en`, `de`, `cn`, `id`, `jp`, `ru`; `language/language.js` exports the map |
| `deploy-commands.js` | Registers commands from `src/commands/` for `GUILD_ID` via REST |
| `public/` | Static dashboard (`dashboard.html`, `dashboard.js`, `styles.css`) |
| `test/*.test.js` | `node:test` suites for `CacheManager`, `DatabaseService`, `Sanitizer`, `ValidationService` |

## Voice flow

1. Member joins `VOICE_CHANNEL_ID`: `createTempChannel()` creates
   `<username> - room` in `CATEGORY_CHANNEL_ID` with owner permission
   overwrites, registers ownership, moves the member.
2. Member leaves or switches: if the member owned the old channel and it is now
   empty, the channel is deleted and ownership cleaned up.
3. On startup, empty channels ending with ` - room` in the category are deleted.

## Interaction flow

1. Slash command: `handleCommand()` looks up `client.commands`.
2. Other interactions: per-user rate limit (10 per 60 s), then routing by
   `customId`:
   - Button: text modal (`name`, `limit`), select menus (`privacy`,
     `bitrate`, `preset`, user pickers for `kick`, `transfer`, `trust`,
     `untrust`, `invite`, `block`, `unblock`) or direct execution (`claim`,
     `delete`, `dnd`).
   - Modal submit / user select: `client.modals.get(customId)`.
   - String select: `client.modals.get(customId.replace('_select', ''))`.
3. Handlers check `OwnershipManager.check()`, validate input, act on the
   channel, call `log()` and reply ephemerally with `t(...)` texts.

## SQLite schema (`DatabaseService.createTables()`)

| Table | Columns | Notes |
| --- | --- | --- |
| `channels` | `channel_id` (PK), `guild_id`, `owner_id`, `created_at`, `settings` (JSON text, default `{}`) | Indexes on `guild_id`, `owner_id` |
| `channel_permissions` | `id` (PK), `channel_id`, `user_id`, `permission_type` (`trust` or `block`), `created_at` | Unique `(channel_id, user_id, permission_type)`, FK to `channels` with cascade |
| `metrics` | `id` (PK), `metric_type`, `metric_value`, `recorded_at` | Rows older than 30 days removed by `cleanupOldMetrics()` |

No migration mechanism; tables are created with `CREATE TABLE IF NOT EXISTS`.

## Shutdown

`SIGINT`/`SIGTERM` clear the cleanup interval, close the DB and stop the
monitoring and dashboard servers.

## Invariants

- Ownership is stored in `client.tempVoiceOwners` and table `channels`;
  `OwnershipManager` keeps both in sync and restores memory from the DB.
- The bot serves exactly one guild (`GUILD_ID`); invalid channel IDs stop the
  process in `src/events/ready.js`.
- The dashboard HTTP API has no authentication; access control relies on the
  network (see `docs/deployment.md`).
