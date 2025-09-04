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
  customId: 'kick',
  aliases: ['kick_select'],

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'kick', 8, 60000);
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
        return interaction.update({
          content: t('invalid_user', lang),
          components: []
        }).catch(() => {});
      }

      // Find target member in channel
      const targetMember = channel.members.get(sanitizedId);
      if (!targetMember) {
        return interaction.update({
          content: t('user_not_found', lang),
          components: []
        }).catch(() => {});
      }

      // Prevent kicking yourself
      if (targetMember.id === member.id) {
        return interaction.update({
          content: t('cannot_kick_self', lang),
          components: []
        }).catch(() => {});
      }

      // Prevent kicking server administrators
      if (targetMember.permissions.has('Administrator')) {
        return interaction.update({
          content: t('cannot_kick_admin', lang),
          components: []
        }).catch(() => {});
      }

      // Check if user has higher role than bot
      if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.update({
          content: t('cannot_kick_higher_role', lang),
          components: []
        }).catch(() => {});
      }

      try {
        // Disconnect user from voice channel
        await targetMember.voice.disconnect(`Kicked by ${member.user.username}`);

        log('log_kick', client, {
          user: targetMember.user.username,
          channel: channel.name,
          by: member.user.username
        });

        metrics.recordInteraction('kick_user');

        await interaction.update({
          content: t('log_kick', lang, {
            user: `<@${targetMember.id}>`,
            channel: channel.name
          }),
          components: []
        }).catch(() => {});

      } catch (kickError) {
        // Handle kick errors (user might have left already)
        await interaction.update({
          content: t('kick_failed', lang, { user: `<@${targetMember.id}>` }),
          components: []
        }).catch(() => {});

        metrics.recordError('kick_failed');
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:kick');
    } finally {
      client.activeInteractions?.delete(interaction.user.id);
    }
  }
};
