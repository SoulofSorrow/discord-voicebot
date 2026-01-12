import { embedSender } from '../handlers/embedSender.js';
import { logStartup } from '../utils/logger.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { cache } from '../utils/CacheManager.js';
import { metrics } from '../utils/MetricsCollector.js';
import config from '../../config/config.js';
import t from '../utils/t.js';

export default async client => {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channels = await guild.channels.fetch();

    const category = channels.get(process.env.CATEGORY_CHANNEL_ID);
    const embed = channels.get(process.env.EMBED_CHANNEL_ID);
    const voice = channels.get(process.env.VOICE_CHANNEL_ID);
    const log = process.env.LOG_CHANNEL_ID
      ? channels.get(process.env.LOG_CHANNEL_ID)
      : null;

    // Validation mit besseren Fehlermeldungen
    if (!category || category.type !== 4) {
      logStartup(t('invalid_category', config.language));
      process.exit(1);
    }

    if (!embed || !['GUILD_TEXT', 0].includes(embed.type)) {
      logStartup(t('invalid_embed', config.language));
      process.exit(1);
    }

    if (!voice || !['GUILD_VOICE', 2].includes(voice.type)) {
      logStartup(t('invalid_voice', config.language));
      process.exit(1);
    }

    // Cache wichtige Channel Referenzen
    cache.set('category_channel', category, 24 * 60 * 60 * 1000); // 24h
    cache.set('embed_channel', embed, 24 * 60 * 60 * 1000);
    cache.set('voice_channel', voice, 24 * 60 * 60 * 1000);
    if (log) cache.set('log_channel', log, 24 * 60 * 60 * 1000);

    await embedSender(embed);

    // Startup Logging
    logStartup(`✅ Logged in as ${client.user.tag}`);
    logStartup(`📁 Category: ${category.name} (${category.id})`);
    logStartup(`📝 Embed: ${embed.name} (${embed.id})`);
    logStartup(`🔊 Voice: ${voice.name} (${voice.id})`);
    logStartup(`📋 Log: ${log ? `${log.name} (${log.id})` : '[not set]'}`);
    logStartup(`🌐 Language: ${config.language}`);
    logStartup(`📊 Logging: ${config.log ? 'enabled' : 'disabled'}`);
    logStartup(`🔧 Loaded ${client.modals.size} modals:`);

    for (const name of client.modals.keys()) {
      logStartup(`   • ${name}`);
    }
    
    // Cleanup alte temp channels beim Start
    await cleanupOrphanedChannels(client, category);
    
    logStartup('🚀 Bot is ready and operational!');
    
  } catch (error) {
    await ErrorHandler.handle(error, null, client, 'ready');
    logStartup('❌ Failed to start bot');
    process.exit(1);
  }
};

async function cleanupOrphanedChannels(client, category) {
  try {
    const tempChannels = category.children.cache.filter(ch => 
      ch.name.endsWith(' - room') && ch.members.size === 0
    );
    
    let cleaned = 0;
    for (const [, channel] of tempChannels) {
      try {
        await channel.delete();
        client.tempVoiceOwners?.delete(channel.id);
        cleaned++;
      } catch (err) {
        // Channel might be deleted already
      }
    }
    
    if (cleaned > 0) {
      logStartup(`🧹 Cleaned up ${cleaned} orphaned temp channels`);
    }
  } catch (error) {
    logStartup('⚠️  Failed to cleanup orphaned channels');
  }
}
