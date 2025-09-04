import { MessageFlags } from 'discord-api-types/v10';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'limit',

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

      const input = interaction.fields.getTextInputValue('limit_input');
      const validation = ValidationService.validateUserLimit(input);

      if (!validation.valid) {
        return interaction.reply({ 
          content: t('invalid_limit', lang), 
          flags: MessageFlags.Ephemeral 
        });
      }

      const limit = validation.value;
      await channel.setUserLimit(limit);

      log('log_limit', client, {
        user: member.user.username,
        limit,
        channel: channel.name
      });

      return interaction.reply({
        content: t('limit_updated', lang, { limit }),
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:limit');
    }
  }
};
