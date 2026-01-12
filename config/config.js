import 'dotenv/config';

// Standard-Konfiguration (Fallback-Werte)
const defaultConfig = {
  label: 'TempVoice',
  embedcode: '#2f3136',
  language: 'en',
  log: true
};

// Environment Override-Mapping
const envOverrides = {
  // Bot Settings
  label: process.env.BOT_LABEL,
  embedcode: process.env.EMBED_COLOR,
  language: process.env.BOT_LANGUAGE,
  log: process.env.ENABLE_LOGGING === 'true' ? true : process.env.ENABLE_LOGGING === 'false' ? false : undefined,

  // Performance Settings
  maxTempChannels: process.env.MAX_TEMP_CHANNELS ? parseInt(process.env.MAX_TEMP_CHANNELS) : undefined,
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : undefined,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : undefined,

  // Debug & Development
  debugMode: process.env.DEBUG_MODE === 'true',
  logLevel: process.env.LOG_LEVEL,

  // Database (optional) - ENTFERNT da nicht verwendet
  // databaseUrl: process.env.DATABASE_URL,

  // Monitoring (optional)
  sentryDsn: process.env.SENTRY_DSN,
  metricsEndpoint: process.env.METRICS_ENDPOINT,
  errorWebhookUrl: process.env.ERROR_WEBHOOK_URL
};

// Merge Konfiguration: Env-Werte überschreiben Defaults
const mergeConfig = (defaults, overrides) => {
  const result = { ...defaults };

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }

  return result;
};

// Finale Konfiguration
const config = mergeConfig(defaultConfig, envOverrides);

// Validation & Warnings
if (config.debugMode) {
  console.log('🐛 Debug Mode aktiviert');
  console.log('📋 Finale Konfiguration:', JSON.stringify(config, null, 2));
}

// Validierung kritischer Werte
const validLanguages = ['en', 'de', 'cn', 'id', 'jp', 'ru'];
if (!validLanguages.includes(config.language)) {
  console.warn(`⚠️  Unbekannte Sprache: ${config.language}, fallback zu 'en'`);
  config.language = 'en';
}

if (config.embedcode && !/^#[0-9A-Fa-f]{6}$/.test(config.embedcode)) {
  console.warn(`⚠️  Ungültige Embed-Farbe: ${config.embedcode}, fallback zu '#2f3136'`);
  config.embedcode = '#2f3136';
}

export default config;
