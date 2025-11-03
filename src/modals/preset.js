import { ErrorHandler } from '../utils/ErrorHandler.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import PresetService from '../services/PresetService.js';
import { ErrorMessageService } from '../utils/ErrorMessageService.js';
import { logger } from '../utils/StructuredLogger.js';
import t from '../utils/t.js';
import config from '../../config/config.js';

/**
 * Preset modal - Apply channel templates
 */
export default {
  name: 'preset',
  aliases: ['template', 'apply-preset'],
  description: 'Apply a preset template to your channel',

  /**
   * Execute preset application
   */
  async execute(interaction, client) {
    try {
      // Check if user is in a voice channel
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        const errorMsg = ErrorMessageService.format('not_in_channel');
        return interaction.reply({
          content: errorMsg,
          ephemeral: true,
        });
      }

      // Check ownership
      const isOwner = OwnershipManager.check(client, voiceChannel.id, interaction.user.id);
      if (!isOwner) {
        const errorMsg = ErrorMessageService.format('not_owner');
        return interaction.reply({
          content: errorMsg,
          ephemeral: true,
        });
      }

      // Check if it's a select menu interaction
      if (interaction.isStringSelectMenu()) {
        const selectedPreset = interaction.values[0];

        // Validate preset access
        const accessCheck = PresetService.validatePresetAccess(member, selectedPreset);
        if (!accessCheck.allowed) {
          return interaction.reply({
            content: `❌ ${accessCheck.reason}`,
            ephemeral: true,
          });
        }

        // Apply preset
        try {
          const result = await PresetService.applyPreset(voiceChannel, selectedPreset, member);
          const preset = PresetService.getPreset(selectedPreset);

          logger.interaction(interaction.user.id, 'preset_applied', {
            channelId: voiceChannel.id,
            preset: selectedPreset,
            settings: result.applied,
          });

          // Create success embed
          const embed = {
            color: 0x57F287, // Green
            title: `${preset.icon} Preset Applied: ${preset.name}`,
            description: preset.description,
            fields: PresetService.getPresetFields(selectedPreset),
            footer: {
              text: 'You can further customize your channel using the dashboard',
            },
            timestamp: new Date().toISOString(),
          };

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (error) {
          logger.error('Failed to apply preset', {
            error,
            userId: interaction.user.id,
            channelId: voiceChannel.id,
            preset: selectedPreset,
          });

          return interaction.reply({
            content: `❌ Failed to apply preset: ${error.message}`,
            ephemeral: true,
          });
        }
      }

      // Show preset selection menu
      const presetOptions = PresetService.getPresetOptions();

      const row = {
        type: 1, // Action Row
        components: [
          {
            type: 3, // String Select Menu
            custom_id: 'preset_select',
            placeholder: '⚙️ Choose a channel preset',
            min_values: 1,
            max_values: 1,
            options: presetOptions,
          },
        ],
      };

      const embed = {
        color: 0x5865F2, // Blurple
        title: '⚙️ Channel Presets',
        description: 'Choose a preset template to quickly configure your channel',
        fields: [
          {
            name: '📢 Available Presets',
            value: presetOptions.map(opt => `${opt.emoji} **${opt.label}** - ${opt.description}`).join('\n'),
          },
        ],
        footer: {
          text: 'Select a preset from the dropdown below',
        },
      };

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      await ErrorHandler.handle(error, interaction, client, 'preset');
    }
  },
};
