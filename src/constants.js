/**
 * Centralized constants for the TempVoice bot
 * Eliminates magic strings and provides single source of truth
 */

/**
 * Discord permission flags used throughout the bot
 */
export const PERMISSIONS = {
  MANAGE_CHANNELS: 'ManageChannels',
  MANAGE_ROLES: 'ManageRoles',
  CONNECT: 'Connect',
  MOVE_MEMBERS: 'MoveMembers',
  MUTE_MEMBERS: 'MuteMembers',
  DEAFEN_MEMBERS: 'DeafenMembers',
  SEND_MESSAGES: 'SendMessages',
  VIEW_CHANNEL: 'ViewChannel',
  CREATE_INSTANT_INVITE: 'CreateInstantInvite',
};

/**
 * Channel types
 */
export const CHANNEL_TYPES = {
  GUILD_VOICE: 2,
  GUILD_TEXT: 0,
  GUILD_CATEGORY: 4,
};

/**
 * Interaction types
 */
export const INTERACTION_TYPES = {
  BUTTON: 'button',
  MODAL: 'modal',
  SELECT_MENU: 'selectMenu',
  COMMAND: 'command',
};

/**
 * Modal action types
 */
export const MODAL_ACTIONS = {
  NAME: 'name',
  LIMIT: 'limit',
  PRIVACY: 'privacy',
  DND: 'dnd',
  REGION: 'region',
  TRUST: 'trust',
  UNTRUST: 'untrust',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  BITRATE: 'bitrate',
  INVITE: 'invite',
  KICK: 'kick',
  CLAIM: 'claim',
  TRANSFER: 'transfer',
  DELETE: 'delete',
  PRESET: 'preset',
};

/**
 * Privacy options
 */
export const PRIVACY_OPTIONS = {
  LOCK: 'lock',
  UNLOCK: 'unlock',
  INVISIBLE: 'invisible',
  VISIBLE: 'visible',
  CLOSE_CHAT: 'closechat',
  OPEN_CHAT: 'openchat',
};

/**
 * Voice regions
 */
export const VOICE_REGIONS = {
  AUTO: 'auto',
  US_WEST: 'us-west',
  US_EAST: 'us-east',
  US_CENTRAL: 'us-central',
  US_SOUTH: 'us-south',
  EUROPE: 'europe',
  SINGAPORE: 'singapore',
  JAPAN: 'japan',
  RUSSIA: 'russia',
  BRAZIL: 'brazil',
  HONGKONG: 'hongkong',
  SYDNEY: 'sydney',
  SOUTH_AFRICA: 'southafrica',
  INDIA: 'india',
};

/**
 * Bitrate presets (in kbps)
 */
export const BITRATE_PRESETS = {
  LOW: 32,
  NORMAL: 64,
  GOOD: 96,
  HIGH: 128,
  STUDIO: 256,
  MAX: 384,
};

/**
 * User limit presets
 */
export const USER_LIMIT_PRESETS = {
  UNLIMITED: 0,
  SMALL: 5,
  MEDIUM: 10,
  LARGE: 25,
  MAX: 99,
};

/**
 * Cache TTL values (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 60 * 1000,           // 1 minute
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  HOUR: 60 * 60 * 1000,       // 1 hour
  DAY: 24 * 60 * 60 * 1000,   // 24 hours
};

/**
 * Rate limit windows (in milliseconds)
 */
export const RATE_LIMIT_WINDOWS = {
  FAST: 10 * 1000,      // 10 seconds
  NORMAL: 60 * 1000,    // 1 minute
  SLOW: 5 * 60 * 1000,  // 5 minutes
};

/**
 * Rate limit thresholds
 */
export const RATE_LIMITS = {
  USER_PER_MINUTE: 10,
  CHANNEL_PER_MINUTE: 50,
  GLOBAL_PER_MINUTE: 200,
  STRICT_USER_PER_5MIN: 3,
};

/**
 * Timeout durations (in milliseconds)
 */
export const TIMEOUTS = {
  INTERACTION: 30 * 1000,      // 30 seconds
  API_REQUEST: 10 * 1000,      // 10 seconds
  CLEANUP_INTERVAL: 10 * 60 * 1000,  // 10 minutes
  METRICS_CLEANUP: 30 * 24 * 60 * 60 * 1000,  // 30 days
};

/**
 * Error codes
 */
export const ERROR_CODES = {
  UNKNOWN_CHANNEL: 10003,
  MISSING_PERMISSIONS: 50013,
  CANNOT_DM_USER: 50007,
  UNKNOWN_USER: 10013,
  UNKNOWN_MEMBER: 10007,
};

/**
 * Emoji IDs for dashboard buttons
 */
export const EMOJIS = {
  NAME: '📝',
  LIMIT: '👥',
  PRIVACY: '🔒',
  DND: '🔕',
  REGION: '🌍',
  TRUST: '✅',
  UNTRUST: '❌',
  BLOCK: '🚫',
  UNBLOCK: '🔓',
  BITRATE: '🎵',
  INVITE: '📧',
  KICK: '👢',
  CLAIM: '👑',
  TRANSFER: '🔄',
  DELETE: '🗑️',
  PRESET: '⚙️',
  ANALYTICS: '📊',
  SETTINGS: '🛠️',
};

/**
 * Button styles
 */
export const BUTTON_STYLES = {
  PRIMARY: 1,    // Blurple
  SECONDARY: 2,  // Grey
  SUCCESS: 3,    // Green
  DANGER: 4,     // Red
  LINK: 5,       // Link button
};

/**
 * Embed colors (hex)
 */
export const COLORS = {
  PRIMARY: 0x2f3136,
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  DANGER: 0xED4245,
  INFO: 0x5865F2,
};

/**
 * Log event types
 */
export const LOG_EVENTS = {
  CHANNEL_CREATED: 'channel_created',
  CHANNEL_DELETED: 'channel_deleted',
  CHANNEL_RENAMED: 'channel_renamed',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_SWITCHED: 'user_switched',
  OWNERSHIP_TRANSFERRED: 'ownership_transferred',
  PERMISSION_UPDATED: 'permission_updated',
  ERROR_OCCURRED: 'error_occurred',
};

/**
 * Metric types
 */
export const METRICS = {
  CHANNELS_CREATED: 'channelsCreated',
  CHANNELS_DELETED: 'channelsDeleted',
  INTERACTIONS: 'interactions',
  ERRORS: 'errors',
  CACHE_HITS: 'cacheHits',
  CACHE_MISSES: 'cacheMisses',
  DB_OPERATIONS: 'dbOperations',
};

/**
 * Default values
 */
export const DEFAULTS = {
  CHANNEL_NAME_SUFFIX: '- room',
  BITRATE: 64,
  USER_LIMIT: 0,
  REGION: 'auto',
  LANGUAGE: 'en',
  CACHE_SIZE: 1000,
  CACHE_TTL: 5 * 60 * 1000,
  LOG_LEVEL: 'info',
  METRICS_PORT: 9090,
};

/**
 * Validation limits
 */
export const VALIDATION = {
  CHANNEL_NAME_MIN: 2,
  CHANNEL_NAME_MAX: 100,
  USER_LIMIT_MIN: 0,
  USER_LIMIT_MAX: 99,
  BITRATE_MIN: 8,
  BITRATE_MAX: 384,
};

/**
 * Feature flags
 */
export const FEATURES = {
  DATABASE_PERSISTENCE: true,
  PROMETHEUS_METRICS: true,
  SENTRY_ERRORS: true,
  STRUCTURED_LOGGING: true,
  CHANNEL_PRESETS: true,
  ADMIN_COMMANDS: true,
  ANALYTICS_API: true,
  LRU_CACHE: true,
};
