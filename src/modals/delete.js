import { MessageFlags } from 'discord-api-types/v10';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ValidationService } from '../utils/ValidationService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'delete',
  
  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice.channel;

      const validation = ValidationService.validateVoiceChannel(member);
      if (!validation.isValid) {
        return interaction.reply({ 
          content: t('not_in_channel', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      if (!OwnershipManager.check(client, channel.id, member.id)) {
        return interaction.reply({ 
          content: t('not_owner', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Mark as deleted by interaction to prevent duplicate logging
      client.deletedByInteraction.add(channel.id);

      await interaction.reply({ 
        content: t('deleted', lang), 
        flags: MessageFlags.Ephemeral 
      });

      log('log_deleted', client, { channel: channel.name });

      // Delete with slight delay to ensure reply is sent
      setTimeout(async () => {
        try {
          await channel.delete();
          OwnershipManager.cleanup(client, channel.id);
        } catch (error) {
          // Channel might already be deleted
          console.warn('Failed to delete channel:', error.message);
        }
      }, 500);

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:delete');
    }
  }
};
