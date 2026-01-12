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
  customId: 'block',

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'block', 10, 60000);
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

      // Prevent blocking yourself
      if (target.id === member.id) {
        return interaction.reply({
          content: t('cannot_block_self', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      // Prevent blocking server administrators
      if (target.permissions.has('Administrator')) {
        return interaction.reply({
          content: t('cannot_block_admin', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      // Apply block permissions
      await channel.permissionOverwrites.edit(target.id, {
        ViewChannel: false,
        Connect: false,
        Speak: false,
        Stream: false,
        UseVAD: false,
        SendMessages: false,
        ReadMessageHistory: false
      });

      // Disconnect user if they're currently in the channel
      if (channel.members.has(target.id)) {
        try {
          await target.voice.disconnect();
        } catch (disconnectError) {
          // User might have already left
        }
      }

      log('log_block', client, {
        user: target.user.username,
        channel: channel.name,
        by: member.user.username
      });

      metrics.recordInteraction('block_user');

      try {
        await interaction.update({
          content: t('blocked', lang, { user: `<@${target.id}>` }),
          components: []
        });
      } catch (updateError) {
        // Fallback if update fails
        await interaction.followUp({
          content: t('blocked', lang, { user: `<@${target.id}>` }),
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:block');
    } finally {
      client.activeInteractions?.delete(interaction.user.id);
    }
  }
};
