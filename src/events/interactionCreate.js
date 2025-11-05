import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ComponentType,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';

import { MessageFlags } from 'discord-api-types/v10';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { ValidationService } from '../utils/ValidationService.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { metrics } from '../utils/MetricsCollector.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';
import config from '../../config/config.js';
import PresetService from '../services/PresetService.js';

class InteractionHandler {
  constructor(client) {
    this.client = client;
    this.activeInteractions = client.activeInteractions;
    this.modals = client.modals;
    this.lang = config.language;
  }

  async handle(interaction) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        return await this.handleCommand(interaction);
      }

      // Rate limiting check (for other interaction types)
      const rateLimitCheck = rateLimiter.checkLimit(
        interaction.user.id,
        'interaction',
        10, // 10 interactions per minute
        60000
      );

      if (!rateLimitCheck.allowed) {
        return interaction.reply({
          content: t('rate_limit_exceeded', this.lang),
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }

      // Early validation
      if (!this.validateInteraction(interaction)) return;

      const { customId } = interaction;
      const userId = interaction.user.id;

      metrics.recordInteraction(interaction.type);

      // Handle different interaction types
      if (interaction.isModalSubmit()) {
        return await this.handleModal(interaction, customId);
      }

      if (interaction.isButton()) {
        return await this.handleButton(interaction, customId, userId);
      }

      if (interaction.isStringSelectMenu()) {
        return await this.handleStringSelect(interaction, customId, userId);
      }

      if (interaction.componentType === ComponentType.UserSelect) {
        return await this.handleUserSelect(interaction, customId, userId);
      }

    } catch (error) {
      await ErrorHandler.handle(error, interaction, this.client, 'InteractionHandler');
      metrics.recordError('interaction_handler');
    }
  }

  validateInteraction(interaction) {
    // Skip validation for modals
    if (interaction.isModalSubmit()) return true;
    
    const validation = ValidationService.validateVoiceChannel(interaction.member);
    
    if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isUserSelectMenu()) {
      return true;
    }

    if (!validation.isValid) {
      interaction.reply({ 
        content: t('not_in_channel', this.lang), 
        flags: MessageFlags.Ephemeral 
      }).catch(() => {});
      return false;
    }

    if (!validation.isInCategory) {
      interaction.reply({ 
        content: t('different_channel', this.lang), 
        flags: MessageFlags.Ephemeral 
      }).catch(() => {});
      return false;
    }

    return true;
  }

  async handleModal(interaction, customId) {
    const modal = this.modals.get(customId);
    if (modal) {
      return await ErrorHandler.handlePromise(
        modal.execute(interaction, this.client, config),
        interaction,
        this.client,
        `Modal:${customId}`
      );
    }
  }

  async handleButton(interaction, customId, userId) {
    const channel = interaction.member.voice.channel;
    
    // Check ownership (except for claim button)
    if (customId !== 'claim') {
      const ownership = ValidationService.validateOwnership(this.client, channel.id, userId);
      if (!ownership.isOwner) {
        return interaction.reply({ 
          content: t('not_owner', this.lang), 
          flags: MessageFlags.Ephemeral 
        });
      }
    }

    // Handle different button types
    const buttonHandlers = {
      name: () => this.showTextModal(interaction, customId, 'name_input', 'name', 'e.g. My Room'),
      limit: () => this.showTextModal(interaction, customId, 'limit_input', 'limit', 'e.g. 5'),
      privacy: () => this.showPrivacyMenu(interaction, userId),
      kick: () => this.showUserSelectMenu(interaction, customId, userId),
      transfer: () => this.showUserSelectMenu(interaction, customId, userId),
      bitrate: () => this.showBitrateMenu(interaction, userId),
      region: () => this.showRegionMenu(interaction, userId),
      preset: () => this.showPresetMenu(interaction, userId),
      // Direct handlers
      claim: () => this.executeDirectModal(interaction, customId),
      delete: () => this.executeDirectModal(interaction, customId),
      dnd: () => this.executeDirectModal(interaction, customId)
    };

    const handler = buttonHandlers[customId];
    if (handler) {
      return await handler();
    }

    // Handle user selection menus
    const userMenus = ['trust', 'untrust', 'invite', 'block', 'unblock'];
    if (userMenus.includes(customId)) {
      return await this.showUserPickerMenu(interaction, customId, userId);
    }
  }

  async showTextModal(interaction, customId, inputId, labelKey, placeholder) {
    const input = new TextInputBuilder()
      .setCustomId(inputId)
      .setLabel(t(labelKey, this.lang))
      .setPlaceholder(placeholder)
      .setRequired(false)
      .setMaxLength(100)
      .setStyle(TextInputStyle.Short);

    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle(t(labelKey, this.lang))
      .addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  async showPrivacyMenu(interaction, userId) {
    if (!this.checkActiveInteraction(interaction, userId)) return;

    this.activeInteractions.add(userId);

    const options = [
      'lock', 'unlock', 'invisible', 'visible', 'closechat', 'openchat'
    ].map(val => ({
      label: t(`privacy_${val}_label`, this.lang),
      description: t(`privacy_${val}_desc`, this.lang),
      value: val
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('privacy')
        .setPlaceholder(t('privacy_placeholder', this.lang))
        .addOptions(options)
    );

    await interaction.reply({ 
      content: t('privacy_option', this.lang), 
      components: [row], 
      flags: MessageFlags.Ephemeral 
    });

    this.setupCollector(interaction, userId, 'privacy', ComponentType.StringSelect);
  }

  async showUserSelectMenu(interaction, customId, userId) {
    const channel = interaction.member.voice.channel;
    const members = [...channel.members.values()].filter(m => m.id !== userId);

    if (!members.length) {
      const key = customId === 'kick' ? 'no_user_to_kick' : 'no_user_to_transfer';
      return interaction.reply({ 
        content: t(key, this.lang), 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (!this.checkActiveInteraction(interaction, userId)) return;
    this.activeInteractions.add(userId);

    const options = members.slice(0, 25).map(m => // Discord limit: 25 options
      new StringSelectMenuOptionBuilder()
        .setLabel(m.user.username)
        .setValue(m.id)
    );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${customId}_select`)
        .setPlaceholder(t(`${customId}_placeholder`, this.lang))
        .addOptions(options)
    );

    await interaction.reply({
      content: t(`${customId}_option`, this.lang),
      components: [row],
      flags: MessageFlags.Ephemeral
    });

    this.setupCollector(interaction, userId, `${customId}_select`, ComponentType.StringSelect);
  }

  async showUserPickerMenu(interaction, customId, userId) {
    if (!this.checkActiveInteraction(interaction, userId)) return;
    this.activeInteractions.add(userId);

    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(customId)
        .setMinValues(1)
        .setMaxValues(1)
        .setPlaceholder(t(`${customId}_placeholder`, this.lang))
    );

    await interaction.reply({ 
      content: t(`${customId}_option`, this.lang), 
      components: [row], 
      flags: MessageFlags.Ephemeral 
    });

    this.setupCollector(interaction, userId, customId, ComponentType.UserSelect);
  }

  async showBitrateMenu(interaction, userId) {
    if (!this.checkActiveInteraction(interaction, userId)) return;
    this.activeInteractions.add(userId);

    const options = [32000, 48000, 64000, 80000, 96000].map(rate =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`${rate / 1000} kbps`)
        .setValue(`${rate}`)
    );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('bitrate_select')
        .setPlaceholder(t('bitrate_placeholder', this.lang))
        .addOptions(options)
    );

    await interaction.reply({
      content: t('bitrate_option', this.lang),
      components: [row],
      flags: MessageFlags.Ephemeral
    });

    this.setupCollector(interaction, userId, 'bitrate_select', ComponentType.StringSelect);
  }

  async showRegionMenu(interaction, userId) {
    if (!this.checkActiveInteraction(interaction, userId)) return;
    this.activeInteractions.add(userId);

    const regions = [
      'auto', 'brazil', 'hongkong', 'india', 'japan', 'russia',
      'singapore', 'southafrica', 'sydney', 'us-central', 'us-east',
      'us-south', 'us-west'
    ];

    const options = regions.map(region =>
      new StringSelectMenuOptionBuilder()
        .setLabel(region.replace(/-/g, ' ').toUpperCase())
        .setValue(region)
    );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('region_select')
        .setPlaceholder(t('region_placeholder', this.lang))
        .addOptions(options)
    );

    await interaction.reply({
      content: t('region_option', this.lang),
      components: [row],
      flags: MessageFlags.Ephemeral
    });

    this.setupCollector(interaction, userId, 'region_select', ComponentType.StringSelect);
  }

  async showPresetMenu(interaction, userId) {
    if (!this.checkActiveInteraction(interaction, userId)) return;
    this.activeInteractions.add(userId);

    const presetOptions = PresetService.getPresetOptions();

    const options = presetOptions.map(preset =>
      new StringSelectMenuOptionBuilder()
        .setLabel(preset.label)
        .setDescription(preset.description)
        .setValue(preset.value)
        .setEmoji(preset.emoji)
    );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('preset_select')
        .setPlaceholder('⚙️ Choose a channel preset')
        .addOptions(options)
    );

    await interaction.reply({
      content: '⚙️ **Channel Presets**\nChoose a preset template to quickly configure your channel.',
      components: [row],
      flags: MessageFlags.Ephemeral
    });

    this.setupCollector(interaction, userId, 'preset_select', ComponentType.StringSelect);
  }

  setupCollector(interaction, userId, customId, componentType) {
    const collector = interaction.channel.createMessageComponentCollector({
      componentType,
      time: 30000, // 30 Sekunden
      filter: i => i.user.id === userId && i.customId === customId
    });

    collector.on('collect', async i => {
      try {
        const handlerId = customId.replace('_select', '');
        const handler = this.modals.get(handlerId);
        if (handler) {
          await handler.execute(i, this.client, config);
        }
        collector.stop('handled');
      } catch (error) {
        await ErrorHandler.handle(error, i, this.client, `Collector:${customId}`);
        collector.stop('error');
      }
    });

    collector.on('end', async (_, reason) => {
      this.activeInteractions.delete(userId);
      if (reason === 'time' && !interaction._wasActiveError) {
        await interaction.editReply({ 
          content: t('interaction_timeout', this.lang), 
          components: [] 
        }).catch(() => {});
      }
    });
  }

  checkActiveInteraction(interaction, userId) {
    if (this.activeInteractions.has(userId)) {
      interaction.reply({ 
        content: t('interaction_already_active', this.lang), 
        flags: MessageFlags.Ephemeral 
      }).catch(() => {});
      interaction._wasActiveError = true;
      return false;
    }
    return true;
  }

  async executeDirectModal(interaction, customId) {
    const handler = this.modals.get(customId);
    if (handler) {
      return await ErrorHandler.handlePromise(
        handler.execute(interaction, this.client, config),
        interaction,
        this.client,
        `DirectModal:${customId}`
      );
    }
  }

  async handleStringSelect(interaction, customId, userId) {
    // Handle string select menu interactions
    const handler = this.modals.get(customId.replace('_select', ''));
    if (handler) {
      return await ErrorHandler.handlePromise(
        handler.execute(interaction, this.client, config),
        interaction,
        this.client,
        `StringSelect:${customId}`
      );
    }
  }

  async handleUserSelect(interaction, customId, userId) {
    // Handle user select menu interactions
    const handler = this.modals.get(customId);
    if (handler) {
      return await ErrorHandler.handlePromise(
        handler.execute(interaction, this.client, config),
        interaction,
        this.client,
        `UserSelect:${customId}`
      );
    }
  }

  async handleCommand(interaction) {
    const command = this.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return interaction.reply({
        content: '❌ Command not found!',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      await command.execute(interaction);
      metrics.recordInteraction(`command_${interaction.commandName}`);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = {
        content: '❌ There was an error executing this command!',
        flags: MessageFlags.Ephemeral
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }

      await ErrorHandler.handle(error, interaction, this.client, `command_${interaction.commandName}`);
    }
  }
}

export default async (client, interaction) => {
  const handler = new InteractionHandler(client);
  await handler.handle(interaction);
};
