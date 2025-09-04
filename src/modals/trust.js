import { MessageFlags } from 'discord-api-types/v10';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { Sanitizer } from '../utils/Sanitizer.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { metrics } from '../utils/MetricsCollector.js';
import { cache } from '../utils/CacheManager.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'trust',

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'trust', 10, 60000);
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

      const selectedId = interaction.values?.[0];
      const sanitizedId = Sanitizer.sanitizeUserId(selectedId);
      
      if (!sanitizedId) {
        return interaction.reply({
          content: t('invalid_user', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      // Get user with caching
      const target = await cache.getGuildMember(interaction.guild, sanitizedId);
      if (!target) {
        return interaction.reply({
          content: t('invalid_user', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      // Prevent trusting yourself
      if (target.id === member.id) {
        return interaction.reply({
          content: t('cannot_trust_self', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      // Apply trust permissions
      await channel.permissionOverwrites.edit(target.id, {
        Connect: true,
        ViewChannel: true,
        Speak: true,
        Stream: true,
        UseVAD: true
      });

      log('log_trust', client, {
        user: target.user.username,
        channel: channel.name,
        by: member.user.username
      });

      metrics.recordInteraction('trust_user');

      try {
        await interaction.update({
          content: t('trusted', lang, { user: `<@${target.id}>` }),
          components: []
        });
      } catch (updateError) {
        // Fallback if update fails
        await interaction.followUp({
          content: t('trusted', lang, { user: `<@${target.id}>` }),
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:trust');
    } finally {
      client.activeInteractions?.delete(interaction.user.id);
    }
  }
};
