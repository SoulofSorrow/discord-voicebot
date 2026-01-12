import { MessageFlags } from 'discord-api-types/v10';
import { PermissionFlagsBits } from 'discord.js';
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
  customId: 'transfer',
  aliases: ['transfer_select'],

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Rate limiting
      const rateLimitCheck = rateLimiter.checkLimit(member.id, 'transfer', 3, 300000); // 3 per 5 minutes
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

      // Prevent transferring to yourself
      if (targetMember.id === member.id) {
        return interaction.update({
          content: t('cannot_transfer_to_self', lang),
          components: []
        }).catch(() => {});
      }

      // Prevent transferring to bots
      if (targetMember.user.bot) {
        return interaction.update({
          content: t('cannot_transfer_to_bot', lang),
          components: []
        }).catch(() => {});
      }

      try {
        // Transfer ownership
        await OwnershipManager.transfer(client, channel.id, targetMember.id);

        // Give new owner permissions
        await channel.permissionOverwrites.edit(targetMember.id, {
          ManageChannels: true,
          ManageRoles: true,
          Connect: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true,
          ViewChannel: true,
          PrioritySpeaker: true
        });

        // Remove old owner's special permissions (but keep basic access)
        await channel.permissionOverwrites.edit(member.id, {
          ManageChannels: false,
          ManageRoles: false,
          MuteMembers: false,
          DeafenMembers: false,
          MoveMembers: false,
          PrioritySpeaker: false,
          // Keep basic permissions
          Connect: true,
          ViewChannel: true,
          Speak: true
        });

        log('log_transfer', client, {
          user: targetMember.user.username,
          channel: channel.name,
          from: member.user.username
        });

        metrics.recordInteraction('transfer_ownership');

        await interaction.update({
          content: t('log_transfer', lang, {
            user: `<@${targetMember.id}>`,
            channel: channel.name
          }),
          components: []
        }).catch(() => {});

        // Notify new owner via DM (optional)
        try {
          const newOwnerMessage = t('ownership_transferred_dm', lang, {
            channel: channel.name,
            from: member.user.username,
            guild: interaction.guild.name
          });
          await targetMember.send(newOwnerMessage);
        } catch (dmError) {
          // DM failed, but that's okay
        }

      } catch (transferError) {
        await interaction.update({
          content: t('transfer_failed', lang),
          components: []
        }).catch(() => {});

        metrics.recordError('transfer_failed');
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:transfer');
    } finally {
      client.activeInteractions?.delete(interaction.user.id);
    }
  }
};
