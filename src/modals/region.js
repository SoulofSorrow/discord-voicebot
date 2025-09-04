import { MessageFlags } from 'discord-api-types/v10';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { metrics } from '../utils/MetricsCollector.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'region',
  aliases: ['region_select'],
  
  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'region', 5, 60000);
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

      const selectedRegion = interaction.values?.[0];
      const validRegions = [
        'auto', 'brazil', 'hongkong', 'india', 'japan', 'russia',
        'singapore', 'southafrica', 'sydney', 'us-central', 'us-east',
        'us-south', 'us-west'
      ];

      if (!selectedRegion || !validRegions.includes(selectedRegion)) {
        client.activeInteractions?.delete(member.id);
        return interaction.reply({ 
          content: t('invalid_region', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Apply region change
      const regionValue = selectedRegion === 'auto' ? null : selectedRegion;
      await channel.setRTCRegion(regionValue);

      const displayRegion = selectedRegion.replace(/-/g, ' ').toUpperCase();

      log('log_region', client, {
        user: member.user.username,
        region: displayRegion,
        channel: channel.name
      });

      metrics.recordInteraction('region_change');

      if (!interaction.replied && !interaction.deferred) {
        await interaction.update({
          content: t('region_updated', lang, { region: displayRegion }),
          components: []
        });
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:region');
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: t('error_region', lang),
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    } finally {
      client.activeInteractions?.delete(member?.id);
    }
  }
};
