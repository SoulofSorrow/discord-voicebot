import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { cache } from '../utils/CacheManager.js';
import { metrics } from '../utils/MetricsCollector.js';
import { logStartup } from '../utils/logger.js';
import databaseService from '../services/DatabaseService.js';
import monitoringService from '../services/MonitoringService.js';
import dashboardService from '../services/DashboardService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function initializeBot(client) {
  try {
    // Initialize database first
    databaseService.initialize();
    logStartup('📦 Database initialized');

    // Initialize collections
    client.activeInteractions = new Set();
    client.modals = new Collection();
    client.commands = new Collection();
    client.tempVoiceOwners = new Map();
    client.deletedByInteraction = new Set();

    // Add utility references
    client.cache = cache;
    client.metrics = metrics;
    client.database = databaseService;
    client.monitoring = monitoringService;

    // Restore channel ownership from database
    restoreChannelOwnership(client);

    // Load commands
    await loadCommands(client);

    // Load modals
    await loadModals(client);

    // Setup event handlers
    await setupEventHandlers(client);

    // Setup periodic cleanup
    setupPeriodicCleanup(client);

    // Start monitoring server
    monitoringService.start(client);

    // Start dashboard server
    if (process.env.ENABLE_DASHBOARD !== 'false') {
      dashboardService.start(client);
    }

    logStartup('🔧 Bot initialization completed');

  } catch (error) {
    await ErrorHandler.handle(error, null, client, 'initializeBot');
    throw error;
  }
}

function restoreChannelOwnership(client) {
  try {
    const channels = databaseService.db.prepare('SELECT channel_id, owner_id FROM channels').all();

    for (const { channel_id, owner_id } of channels) {
      client.tempVoiceOwners.set(channel_id, owner_id);
    }

    logStartup(`   ✓ Restored ${channels.length} channel ownerships from database`);
  } catch (error) {
    logStartup(`   ⚠  Failed to restore channel ownership: ${error.message}`);
  }
}

async function loadCommands(client) {
  const commandsDir = path.join(__dirname, '../commands');

  try {
    // Check if commands directory exists
    if (!fs.existsSync(commandsDir)) {
      logStartup('   ℹ  No commands directory found, skipping command loading');
      return;
    }

    const commandFiles = fs.readdirSync(commandsDir).filter(f =>
      f.endsWith('.js') && f !== 'index.js'
    );

    if (commandFiles.length === 0) {
      logStartup('   ℹ  No command files found');
      return;
    }

    for (const file of commandFiles) {
      try {
        const command = await import(`../commands/${file}`);
        const name = path.parse(file).name;

        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          logStartup(`   ✓ Loaded command: /${command.data.name}`);
        } else {
          logStartup(`   ⚠  Invalid command: ${file} (missing data or execute)`);
        }
      } catch (error) {
        logStartup(`   ❌ Failed to load command: ${file} - ${error.message}`);
      }
    }

    logStartup(`📋 Loaded ${client.commands.size} slash commands`);
  } catch (error) {
    logStartup(`   ❌ Failed to read commands directory: ${error.message}`);
  }
}

async function loadModals(client) {
  const modalsDir = path.join(__dirname, '../modals');

  try {
    const modalFiles = fs.readdirSync(modalsDir).filter(f =>
      f.endsWith('.js') && f !== 'index.js'
    );

    for (const file of modalFiles) {
      try {
        const { default: modal } = await import(`../modals/${file}`);
        const name = path.parse(file).name;

        if (modal && typeof modal.execute === 'function') {
          client.modals.set(name, modal);

          // Handle aliases
          if (modal.aliases && Array.isArray(modal.aliases)) {
            for (const alias of modal.aliases) {
              client.modals.set(alias, modal);
            }
          }

          logStartup(`   ✓ Loaded modal: ${name}`);
        } else {
          logStartup(`   ⚠  Invalid modal: ${file}`);
        }
      } catch (error) {
        logStartup(`   ❌ Failed to load modal: ${file} - ${error.message}`);
      }
    }
  } catch (error) {
    logStartup(`   ❌ Failed to read modals directory: ${error.message}`);
  }
}

async function setupEventHandlers(client) {
  client.once('clientReady', async () => {
    const { default: handleReady } = await import('../events/ready.js');
    await handleReady(client);
  });

  client.on('interactionCreate', async interaction => {
    try {
      const { default: handler } = await import('../events/interactionCreate.js');
      await handler(client, interaction);
    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'interactionCreate');
    }
  });

  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      const { default: handler } = await import('../events/voiceStateUpdate.js');
      await handler(client, oldState, newState);
    } catch (error) {
      await ErrorHandler.handle(error, null, client, 'voiceStateUpdate');
    }
  });

  client.on('channelUpdate', async (oldChannel, newChannel) => {
    try {
      const { default: handler } = await import('../events/channelUpdate.js');
      await handler(client, oldChannel, newChannel);
    } catch (error) {
      await ErrorHandler.handle(error, null, client, 'channelUpdate');
    }
  });

  // Error handling for uncaught errors
  client.on('error', error => {
    ErrorHandler.handle(error, null, client, 'clientError');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    ErrorHandler.handle(reason, null, client, 'unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    ErrorHandler.handle(error, null, client, 'uncaughtException');
    process.exit(1);
  });
}

function setupPeriodicCleanup(client) {
  // Cleanup every 10 minutes
  const cleanupInterval = setInterval(() => {
    try {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);

      // Simple cleanup without timestamp tracking
      if (client.activeInteractions && client.activeInteractions.size > 50) {
        client.activeInteractions.clear();
      }

      // Cleanup deleted by interaction set
      if (client.deletedByInteraction && client.deletedByInteraction.size > 100) {
        client.deletedByInteraction.clear();
      }

      // Cache cleanup
      client.cache?.cleanup?.();

      // Database metrics cleanup (30 days old)
      databaseService.cleanupOldMetrics();

      logStartup('🧹 Performed periodic cleanup');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  // Clear interval on process exit
  process.on('exit', () => {
    clearInterval(cleanupInterval);
    databaseService.close();
    monitoringService.stop();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logStartup('🛑 Received SIGTERM, shutting down gracefully...');
    clearInterval(cleanupInterval);
    databaseService.close();
    monitoringService.stop();
    dashboardService.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logStartup('🛑 Received SIGINT, shutting down gracefully...');
    clearInterval(cleanupInterval);
    databaseService.close();
    monitoringService.stop();
    dashboardService.stop();
    process.exit(0);
  });
}
