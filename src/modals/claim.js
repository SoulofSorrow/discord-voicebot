import { MessageFlags } from 'discord-api-types/v10';
import { PermissionsBitField } from 'discord.js';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'claim',
  
  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const userId = member.id;
      const channel = member.voice?.channel;

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

      const currentOwnerId = client.tempVoiceOwners?.get(channel.id);
      if (!currentOwnerId) {
        return interaction.reply({ 
          content: t('not_temp_channel', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      if (currentOwnerId === userId) {
        return interaction.reply({ 
          content: t('already_owner', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Check if current owner is still in channel
      if (channel.members.has(currentOwnerId)) {
        return interaction.reply({ 
          content: t('owner_still_present', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Transfer ownership
      await OwnershipManager.transfer(client, channel.id, userId);

      // Set permissions
      await channel.permissionOverwrites.edit(userId, {
        ManageChannels: true,
        ManageRoles: true,
        Connect: true,
        MuteMembers: true,
        DeafenMembers: true,
        MoveMembers: true,
        ViewChannel: true
      });

      log('log_claimed', client, { 
        user: member.user.username, 
        channel: channel.name 
      });

      return interaction.reply({
        content: t('log_claimed', lang, { 
          user: member.user.username, 
          channel: channel.name 
        }),
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:claim');
    }
  }
};
