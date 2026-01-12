import { MessageFlags } from 'discord-api-types/v10';
import { PermissionsBitField } from 'discord.js';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export default {
  customId: 'privacy',

  async execute(interaction, client, config) {
    try {
      const lang = config.language;
      const userId = interaction.user.id;
      const voice = interaction.member.voice.channel;

      // Validate ownership
      if (!OwnershipManager.check(client, voice?.id, userId)) {
        return interaction.reply({ 
          content: t('not_owner', lang), 
          flags: MessageFlags.Ephemeral 
        }).catch(() => {});
      }

      const selected = interaction.values?.[0];
      if (!selected) return;

      // Prevent double execution
      if (interaction._privacyExecuted) return;
      interaction._privacyExecuted = true;

      // Remove from active interactions
      client.activeInteractions.delete(userId);

      const everyone = interaction.guild.roles.everyone.id;
      const trusted = voice.permissionOverwrites.cache
        .filter(p => p.allow.has(PermissionsBitField.Flags.Connect) && p.type === 1) // Member type
        .map(p => p.id);

      // Privacy settings map
      const privacyMap = {
        unlock: {
          [everyone]: {
            ViewChannel: true,
            Connect: true
          }
        },
        lock: {
          [everyone]: {
            ViewChannel: true,
            Connect: false
          },
          ...Object.fromEntries(trusted.map(id => [id, {
            ViewChannel: true,
            Connect: true
          }]))
        },
        invisible: {
          [everyone]: {
            ViewChannel: false,
            Connect: false
          },
          ...Object.fromEntries(trusted.map(id => [id, {
            ViewChannel: true,
            Connect: true
          }]))
        },
        visible: {
          [everyone]: {
            ViewChannel: true,
            Connect: null // Reset to default
          }
        },
        closechat: {
          [everyone]: {
            SendMessages: false
          },
          ...Object.fromEntries(trusted.map(id => [id, {
            SendMessages: true
          }]))
        },
        openchat: {
          [everyone]: {
            SendMessages: true
          }
        }
      };

      const rules = privacyMap[selected];
      if (!rules) return;

      // Apply permission changes
      for (const [targetId, permissions] of Object.entries(rules)) {
        const cleanPermissions = {};
        for (const [perm, value] of Object.entries(permissions)) {
          if (value !== null) {
            cleanPermissions[perm] = value;
          }
        }
        
        if (Object.keys(cleanPermissions).length > 0) {
          await voice.permissionOverwrites.edit(targetId, cleanPermissions);
        }
      }

      await interaction.update({
        content: t(`privacy_${selected}`, lang),
        components: []
      }).catch(() => {});

      log('log_privacy', client, {
        user: interaction.user.username,
        value: t(`privacy_${selected}_label`, lang),
        channel: voice.name
      });

    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'modal:privacy');
      client.activeInteractions.delete(interaction.user.id);
    }
  }
};
