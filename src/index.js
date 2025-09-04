import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import initializeBot from './core/initializeBot.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { logStartup } from './utils/logger.js';
import t from './utils/t.js';
import config from '../config/config.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel],
  // Improved client options
  allowedMentions: {
    parse: ['users'],
    repliedUser: false
  },
  presence: {
    status: 'online',
    activities: [{
      name: 'Managing voice channels',
      type: 3 // WATCHING
    }]
  }
});

async function start() {
  try {
    // Validate environment
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is required');
    }

    if (!process.env.GUILD_ID) {
      throw new Error('GUILD_ID is required');
    }

    logStartup('🤖 Starting TempVoice Bot v2.0...');
    logStartup(`🔧 Node.js ${process.version}`);
    logStartup(`📦 Discord.js ${(await import('discord.js')).version}`);
    
    await initializeBot(client);
    await client.login(process.env.DISCORD_TOKEN);
    
  } catch (error) {
    await ErrorHandler.handle(error, null, client, 'startup');
    logStartup('❌ Failed to start bot');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logStartup('🛑 Received SIGINT, shutting down gracefully...');
  
  try {
    client.cache?.clear();
    client.destroy();
    logStartup('✅ Bot shut down successfully');
    process.exit(0);
  } catch (error) {
    logStartup('❌ Error during shutdown');
    process.exit(1);
  }
});

start();
