import { MessageFlags } from 'discord-api-types/v10';
import { PermissionFlagsBits } from 'discord.js';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { metrics } from '../utils/MetricsCollector.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'dnd',
  
  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'dnd', 3, 30000);
      if (!rateLimitCheck.allowed) {
        return interaction.reply({ 
          content: t('rate_limit_exceeded', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Validate channel
      const validation = ValidationService.validateVoiceChannel(member);
      if (!validation.isValid) {
        return interaction.reply({ 
          content: t('not_in_channel', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      if (!validation.isInCategory) {
        return interaction.reply({ 
          content: t('different_channel', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Validate ownership
      if (!OwnershipManager.check(client, channel.id, member.id)) {
        return interaction.reply({ 
          content: t('not_owner', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      const everyone = channel.guild.roles.everyone;
      const currentPerms = channel.permissionOverwrites.cache.get(everyone.id);
      const isDND = currentPerms?.deny?.has(PermissionFlagsBits.Speak);

      // Toggle DND permissions
      const permsToUpdate = {
        Speak: isDND ? null : false,
        Stream: isDND ? null : false,
        UseVAD: isDND ? null : false,
        PrioritySpeaker: isDND ? null : false,
        UseSoundboard: isDND ? null : false,
        UseEmbeddedActivities: isDND ? null : false
      };

      await channel.permissionOverwrites.edit(everyone, permsToUpdate);

      const statusKey = isDND ? 'dnd_off' : 'dnd_on';
      const statusText = t(statusKey, lang);

      log('log_dnd', client, {
        user: member.user.username,
        status: isDND ? 'disabled' : 'enabled',
        channel: channel.name
      });

      metrics.recordInteraction('dnd_toggle');

      return interaction.reply({
        content: statusText,
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:dnd');
    }
  }
};
