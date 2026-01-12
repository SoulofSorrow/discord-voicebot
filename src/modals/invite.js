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
  customId: 'invite',

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting - More restrictive for invites to prevent spam
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'invite', 5, 60000);
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

      // Prevent inviting yourself
      if (target.id === member.id) {
        return interaction.reply({
          content: t('cannot_invite_self', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      // Check if user is already in the channel
      if (channel.members.has(target.id)) {
        return interaction.reply({
          content: t('user_already_in_channel', lang, { user: `<@${target.id}>` }),
          flags: MessageFlags.Ephemeral
        });
      }

      // Check if user is blocked
      const userPerms = channel.permissionOverwrites.cache.get(target.id);
      const isBlocked = userPerms?.deny?.has('ViewChannel');
      
      if (isBlocked) {
        return interaction.reply({
          content: t('cannot_invite_blocked_user', lang),
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        // Create invite with limited uses and expiration
        const invite = await channel.createInvite({ 
          maxAge: 86400, // 24 hours
          maxUses: 1,    // Single use
          unique: true,
          reason: `Invited by ${member.user.username}`
        });

        // Send DM to user
        const inviteMessage = t('invite_message', lang, {
          name: channel.name,
          voiceLink: invite.url,
          invitedBy: member.user.username
        });

        await target.send(inviteMessage);

        log('log_invite', client, {
          user: target.user.username,
          channel: channel.name,
          by: member.user.username
        });

        metrics.recordInteraction('invite_sent');

        try {
          await interaction.update({
            content: t('invited_user', lang, { user: `<@${target.id}>` }),
            components: []
          });
        } catch (updateError) {
          await interaction.followUp({
            content: t('invited_user', lang, { user: `<@${target.id}>` }),
            flags: MessageFlags.Ephemeral
          }).catch(() => {});
        }

      } catch (dmError) {
        // Handle DM sending errors
        const isDMError = dmError.code === 50007;
        const isInviteError = dmError.code === 50013;
        
        let errorMessage;
        if (isDMError) {
          errorMessage = t('error_user_dms_closed', lang);
        } else if (isInviteError) {
          errorMessage = t('error_create_invite', lang);
        } else {
          errorMessage = t('error_send_invite', lang);
        }

        try {
          await interaction.update({
            content: errorMessage,
            components: []
          });
        } catch (updateError) {
          await interaction.followUp({
            content: errorMessage,
            flags: MessageFlags.Ephemeral
          }).catch(() => {});
        }

        metrics.recordError('invite_failed');
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:invite');
    } finally {
      client.activeInteractions?.delete(interaction.user.id);
    }
  }
};
