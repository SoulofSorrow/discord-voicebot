import { MessageFlags } from 'discord-api-types/v10';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { metrics } from '../utils/MetricsCollector.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'bitrate',
  aliases: ['bitrate_select'],
  
  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'bitrate', 5, 60000);
      if (!rateLimitCheck.allowed) {
        return interaction.reply({ 
          content: t('rate_limit_exceeded', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Validate channel
      const validation = ValidationService.validateVoiceChannel(member);
      if (!validation.isValid) {
        client.activeInteractions?.delete(member.id);
        return interaction.reply({ 
          content: t('not_in_channel', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      if (!validation.isInCategory) {
        client.activeInteractions?.delete(member.id);
        return interaction.reply({ 
          content: t('different_channel', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Validate ownership
      if (!OwnershipManager.check(client, channel.id, member.id)) {
        client.activeInteractions?.delete(member.id);
        return interaction.reply({ 
          content: t('not_owner', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      const selectedBitrate = parseInt(interaction.values?.[0], 10);
      if (!selectedBitrate || ![32000, 48000, 64000, 80000, 96000].includes(selectedBitrate)) {
        client.activeInteractions?.delete(member.id);
        return interaction.reply({ 
          content: t('invalid_bitrate', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Apply bitrate change
      await channel.setBitrate(selectedBitrate);

      const bitrateKbps = selectedBitrate / 1000;
      
      log('log_bitrate', client, { 
        user: member.user.username, 
        bitrate: bitrateKbps, 
        channel: channel.name 
      });

      metrics.recordInteraction('bitrate_change');

      if (!interaction.replied && !interaction.deferred) {
        await interaction.update({
          content: t('bitrate_updated', lang, { bitrate: bitrateKbps }),
          components: []
        });
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:bitrate');
    } finally {
      client.activeInteractions?.delete(member?.id);
    }
  }
};
