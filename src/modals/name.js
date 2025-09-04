import { MessageFlags } from 'discord-api-types/v10';
import { ValidationService } from '../utils/ValidationService.js';
import { Sanitizer } from '../utils/Sanitizer.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'name',

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const member = interaction.member;
      const channel = member.voice?.channel;

      // Validate ownership
      if (!OwnershipManager.check(client, channel?.id, member.id)) {
        return interaction.reply({ 
          content: t('not_owner', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      const rawInput = interaction.fields.getTextInputValue('name_input');
      const sanitizedInput = Sanitizer.sanitizeChannelName(rawInput);
      
      // Validate input
      const validation = ValidationService.validateChannelName(sanitizedInput);
      if (!validation.valid) {
        return interaction.reply({ 
          content: t('invalid_name', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      const newName = validation.value;

      // Set name with error handling
      await channel.setName(newName);
      channel.renamedByModal = true;

      log('log_renamed', client, {
        user: member.user.username,
        name: newName
      });

      return interaction.reply({
        content: t('channel_renamed', lang, { name: newName }),
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:name');
      
      if (!interaction.replied) {
        return interaction.reply({
          content: t('error_interaction', config.language),
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  }
};
