import { PermissionFlagsBits } from 'discord.js';
import { BITRATE_PRESETS, USER_LIMIT_PRESETS, VOICE_REGIONS, PRIVACY_OPTIONS } from '../constants.js';

/**
 * Channel preset templates for quick setup
 * Provides pre-configured channel settings for common use cases
 */
export class PresetService {
  /**
   * Get all available presets
   * @returns {Object} Map of preset name to configuration
   */
  static getPresets() {
    return {
      default: {
        name: 'Default',
        description: 'Standard voice channel settings',
        icon: '📢',
        settings: {
          bitrate: BITRATE_PRESETS.NORMAL,
          userLimit: USER_LIMIT_PRESETS.UNLIMITED,
          region: VOICE_REGIONS.AUTO,
          locked: false,
          hidden: false,
          chatClosed: false,
        },
      },

      vip: {
        name: 'VIP Room',
        description: 'Exclusive high-quality room for VIP members',
        icon: '👑',
        settings: {
          bitrate: BITRATE_PRESETS.HIGH,
          userLimit: USER_LIMIT_PRESETS.SMALL,
          region: VOICE_REGIONS.AUTO,
          locked: true,
          hidden: true,
          chatClosed: true,
        },
        permissions: {
          requireRole: true, // Requires VIP role check
        },
      },

      gaming: {
        name: 'Gaming',
        description: 'Optimized for gaming with good audio quality',
        icon: '🎮',
        settings: {
          bitrate: BITRATE_PRESETS.GOOD,
          userLimit: USER_LIMIT_PRESETS.SMALL,
          region: VOICE_REGIONS.AUTO,
          locked: false,
          hidden: false,
          chatClosed: false,
        },
      },

      music: {
        name: 'Music Studio',
        description: 'High-quality audio for music and streaming',
        icon: '🎵',
        settings: {
          bitrate: BITRATE_PRESETS.STUDIO,
          userLimit: USER_LIMIT_PRESETS.SMALL,
          region: VOICE_REGIONS.AUTO,
          locked: false,
          hidden: false,
          chatClosed: false,
        },
      },

      study: {
        name: 'Study Room',
        description: 'Quiet focused environment for studying',
        icon: '📚',
        settings: {
          bitrate: BITRATE_PRESETS.NORMAL,
          userLimit: USER_LIMIT_PRESETS.MEDIUM,
          region: VOICE_REGIONS.AUTO,
          locked: false,
          hidden: false,
          chatClosed: false,
        },
      },

      party: {
        name: 'Party Room',
        description: 'Large room for social gatherings',
        icon: '🎉',
        settings: {
          bitrate: BITRATE_PRESETS.GOOD,
          userLimit: USER_LIMIT_PRESETS.LARGE,
          region: VOICE_REGIONS.AUTO,
          locked: false,
          hidden: false,
          chatClosed: false,
        },
      },

      meeting: {
        name: 'Meeting Room',
        description: 'Professional setting for meetings',
        icon: '💼',
        settings: {
          bitrate: BITRATE_PRESETS.HIGH,
          userLimit: USER_LIMIT_PRESETS.MEDIUM,
          region: VOICE_REGIONS.AUTO,
          locked: true,
          hidden: false,
          chatClosed: false,
        },
      },

      private: {
        name: 'Private Room',
        description: 'Locked and hidden from others',
        icon: '🔒',
        settings: {
          bitrate: BITRATE_PRESETS.GOOD,
          userLimit: USER_LIMIT_PRESETS.SMALL,
          region: VOICE_REGIONS.AUTO,
          locked: true,
          hidden: true,
          chatClosed: true,
        },
      },

      open: {
        name: 'Open Hall',
        description: 'Public space for everyone',
        icon: '🌐',
        settings: {
          bitrate: BITRATE_PRESETS.NORMAL,
          userLimit: USER_LIMIT_PRESETS.UNLIMITED,
          region: VOICE_REGIONS.AUTO,
          locked: false,
          hidden: false,
          chatClosed: false,
        },
      },

      podcast: {
        name: 'Podcast Studio',
        description: 'Professional audio for recording',
        icon: '🎙️',
        settings: {
          bitrate: BITRATE_PRESETS.MAX,
          userLimit: 5,
          region: VOICE_REGIONS.AUTO,
          locked: true,
          hidden: false,
          chatClosed: true,
        },
      },
    };
  }

  /**
   * Get preset by name
   * @param {string} presetName - Name of the preset
   * @returns {Object|null} Preset configuration or null
   */
  static getPreset(presetName) {
    const presets = this.getPresets();
    return presets[presetName] || null;
  }

  /**
   * Apply preset to a channel
   * @param {VoiceChannel} channel - Discord voice channel
   * @param {string} presetName - Name of preset to apply
   * @param {GuildMember} owner - Channel owner
   * @returns {Promise<Object>} Applied settings
   */
  static async applyPreset(channel, presetName, owner) {
    const preset = this.getPreset(presetName);
    if (!preset) {
      throw new Error(`Preset '${presetName}' not found`);
    }

    const { settings } = preset;
    const applied = {};

    try {
      // Apply bitrate with server limit validation
      if (settings.bitrate) {
        const requestedBitrate = settings.bitrate * 1000; // Convert to bits
        const maxBitrate = channel.guild.maximumBitrate || 96000; // Default to 96kbps if not available
        const actualBitrate = Math.min(requestedBitrate, maxBitrate);

        await channel.setBitrate(actualBitrate);
        applied.bitrate = actualBitrate / 1000; // Store as kbps

        if (requestedBitrate > maxBitrate) {
          applied.bitrateNote = `Limited to ${maxBitrate / 1000} kbps (server max)`;
        }
      }

      // Apply user limit
      if (settings.userLimit !== undefined) {
        await channel.setUserLimit(settings.userLimit);
        applied.userLimit = settings.userLimit;
      }

      // Apply region
      if (settings.region) {
        await channel.setRTCRegion(settings.region === 'auto' ? null : settings.region);
        applied.region = settings.region;
      }

      // Apply privacy settings
      const permissionOverwrites = [];

      // Owner permissions (always)
      permissionOverwrites.push({
        id: owner.id,
        allow: [
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.MuteMembers,
          PermissionFlagsBits.DeafenMembers,
          PermissionFlagsBits.MoveMembers,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ],
      });

      // Everyone permissions based on preset
      const everyonePerms = {
        id: channel.guild.roles.everyone.id,
        allow: [],
        deny: [],
      };

      if (settings.locked) {
        everyonePerms.deny.push(PermissionFlagsBits.Connect);
        applied.locked = true;
      } else {
        everyonePerms.allow.push(PermissionFlagsBits.Connect);
        applied.locked = false;
      }

      if (settings.hidden) {
        everyonePerms.deny.push(PermissionFlagsBits.ViewChannel);
        applied.hidden = true;
      } else {
        everyonePerms.allow.push(PermissionFlagsBits.ViewChannel);
        applied.hidden = false;
      }

      if (settings.chatClosed) {
        everyonePerms.deny.push(PermissionFlagsBits.SendMessages);
        applied.chatClosed = true;
      } else {
        everyonePerms.allow.push(PermissionFlagsBits.SendMessages);
        applied.chatClosed = false;
      }

      permissionOverwrites.push(everyonePerms);

      // Apply all permission overwrites
      await channel.permissionOverwrites.set(permissionOverwrites);

      return {
        success: true,
        preset: presetName,
        applied,
      };
    } catch (error) {
      throw new Error(`Failed to apply preset: ${error.message}`);
    }
  }

  /**
   * Get preset options for select menu
   * @returns {Array} Array of select menu options
   */
  static getPresetOptions() {
    const presets = this.getPresets();
    return Object.entries(presets).map(([key, preset]) => ({
      label: preset.name,
      value: key,
      description: preset.description,
      emoji: preset.icon,
    }));
  }

  /**
   * Get preset settings as embed fields
   * @param {string} presetName - Preset name
   * @returns {Array} Array of embed fields
   */
  static getPresetFields(presetName) {
    const preset = this.getPreset(presetName);
    if (!preset) return [];

    const { settings } = preset;
    const fields = [];

    fields.push({
      name: '🎵 Audio Quality',
      value: `${settings.bitrate} kbps`,
      inline: true,
    });

    fields.push({
      name: '👥 User Limit',
      value: settings.userLimit === 0 ? 'Unlimited' : `${settings.userLimit} users`,
      inline: true,
    });

    fields.push({
      name: '🌍 Region',
      value: settings.region === 'auto' ? 'Automatic' : settings.region,
      inline: true,
    });

    const privacy = [];
    if (settings.locked) privacy.push('🔒 Locked');
    if (settings.hidden) privacy.push('👻 Hidden');
    if (settings.chatClosed) privacy.push('💬 Chat Closed');
    if (privacy.length === 0) privacy.push('🌐 Public');

    fields.push({
      name: '🔐 Privacy',
      value: privacy.join('\n'),
      inline: false,
    });

    return fields;
  }

  /**
   * Validate if user can use a preset
   * @param {GuildMember} member - Guild member
   * @param {string} presetName - Preset name
   * @returns {Object} Validation result
   */
  static validatePresetAccess(member, presetName) {
    const preset = this.getPreset(presetName);
    if (!preset) {
      return {
        allowed: false,
        reason: 'Preset not found',
      };
    }

    // Check if preset requires special permissions
    if (preset.permissions?.requireRole) {
      // Check for VIP or similar role
      const hasVipRole = member.roles.cache.some(role =>
        role.name.toLowerCase().includes('vip') ||
        role.name.toLowerCase().includes('premium') ||
        role.permissions.has(PermissionFlagsBits.ManageChannels)
      );

      if (!hasVipRole) {
        return {
          allowed: false,
          reason: 'This preset requires VIP role or special permissions',
        };
      }
    }

    return {
      allowed: true,
    };
  }

  /**
   * Create custom preset
   * @param {string} name - Preset name
   * @param {Object} settings - Preset settings
   * @returns {Object} Created preset
   */
  static createCustomPreset(name, settings) {
    return {
      name,
      description: 'Custom user-defined preset',
      icon: '⚙️',
      settings,
      custom: true,
    };
  }
}

export default PresetService;
