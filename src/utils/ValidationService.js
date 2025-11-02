/**
 * Enhanced validation service with detailed feedback
 * @class ValidationService
 */
export class ValidationService {
  /**
   * Validate channel name with detailed feedback
   * @param {string} name - Channel name to validate
   * @returns {Object} Validation result with value or error
   */
  static validateChannelName(name) {
    if (!name || typeof name !== 'string') {
      return {
        valid: false,
        error: 'invalid_name',
        message: 'Channel name must be a non-empty string'
      };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return {
        valid: false,
        error: 'invalid_name',
        message: 'Channel name must be at least 2 characters',
        hint: 'Try a longer name'
      };
    }

    if (trimmed.length > 100) {
      return {
        valid: false,
        error: 'invalid_name',
        message: 'Channel name must be at most 100 characters',
        hint: `Current length: ${trimmed.length}. Please shorten it.`
      };
    }

    // Check for forbidden patterns
    const forbidden = /<|>|@everyone|@here|```|discord\.gg/i;
    if (forbidden.test(trimmed)) {
      return {
        valid: false,
        error: 'invalid_name',
        message: 'Channel name contains forbidden characters or patterns',
        hint: 'Avoid: < > @everyone @here ``` discord.gg'
      };
    }

    return { valid: true, value: trimmed };
  }

  /**
   * Validate user limit with range checking
   * @param {number|string} limit - User limit to validate
   * @returns {Object} Validation result
   */
  static validateUserLimit(limit) {
    const num = parseInt(limit, 10);

    if (isNaN(num)) {
      return {
        valid: false,
        error: 'invalid_limit',
        message: 'User limit must be a number',
        hint: 'Enter a number between 0 (unlimited) and 99'
      };
    }

    if (num < 0) {
      return {
        valid: false,
        error: 'invalid_limit',
        message: 'User limit cannot be negative',
        hint: 'Use 0 for unlimited, or 1-99 for a specific limit'
      };
    }

    if (num > 99) {
      return {
        valid: false,
        error: 'invalid_limit',
        message: 'User limit cannot exceed 99',
        hint: 'Maximum allowed: 99 users'
      };
    }

    return {
      valid: true,
      value: num,
      isUnlimited: num === 0
    };
  }

  /**
   * Validate bitrate value
   * @param {number|string} bitrate - Bitrate in kbps
   * @returns {Object} Validation result
   */
  static validateBitrate(bitrate) {
    const num = parseInt(bitrate, 10);

    if (isNaN(num)) {
      return {
        valid: false,
        error: 'invalid_bitrate',
        message: 'Bitrate must be a number'
      };
    }

    if (num < 8 || num > 384) {
      return {
        valid: false,
        error: 'invalid_bitrate',
        message: 'Bitrate must be between 8 and 384 kbps',
        hint: '64 = Normal quality, 96 = Good, 128 = High, 256+ = Studio'
      };
    }

    return {
      valid: true,
      value: num,
      quality: num < 64 ? 'low' : num < 96 ? 'normal' : num < 128 ? 'good' : 'high'
    };
  }

  /**
   * Validate voice region
   * @param {string} region - Voice region code
   * @returns {Object} Validation result
   */
  static validateRegion(region) {
    const validRegions = [
      'auto', 'us-west', 'us-east', 'us-central', 'us-south',
      'europe', 'singapore', 'japan', 'russia', 'brazil',
      'hongkong', 'sydney', 'southafrica', 'india'
    ];

    if (!region || typeof region !== 'string') {
      return {
        valid: false,
        error: 'invalid_region',
        message: 'Region must be specified'
      };
    }

    const normalized = region.toLowerCase();

    if (!validRegions.includes(normalized)) {
      return {
        valid: false,
        error: 'invalid_region',
        message: 'Invalid voice region',
        hint: `Valid regions: ${validRegions.join(', ')}`
      };
    }

    return {
      valid: true,
      value: normalized,
      isAuto: normalized === 'auto'
    };
  }

  /**
   * Validate Discord user ID
   * @param {string} id - User ID to validate
   * @returns {boolean} True if valid
   */
  static validateUserId(id) {
    return /^\d{17,19}$/.test(id);
  }

  /**
   * Validate ownership with context
   * @param {Client} client - Discord client
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @returns {Object} Ownership validation result
   */
  static validateOwnership(client, channelId, userId) {
    const ownerId = client.tempVoiceOwners?.get(channelId);

    return {
      isOwner: ownerId === userId,
      ownerId,
      hasOwner: !!ownerId,
      canClaim: !ownerId
    };
  }

  /**
   * Validate voice channel state
   * @param {GuildMember} member - Discord guild member
   * @returns {Object} Voice channel validation result
   */
  static validateVoiceChannel(member) {
    const channel = member?.voice?.channel;
    const categoryId = process.env.CATEGORY_CHANNEL_ID;

    return {
      isValid: !!channel,
      channel,
      isInCategory: channel?.parentId === categoryId,
      isEmpty: channel?.members?.size === 0,
      memberCount: channel?.members?.size || 0,
      canManage: !!channel
    };
  }

  /**
   * Validate interaction context
   * @param {Interaction} interaction - Discord interaction
   * @returns {Object} Interaction validation result
   */
  static validateInteraction(interaction) {
    if (!interaction) {
      return {
        valid: false,
        error: 'missing_interaction',
        message: 'Interaction object is missing'
      };
    }

    if (!interaction.user || !interaction.user.id) {
      return {
        valid: false,
        error: 'missing_user',
        message: 'User information is missing'
      };
    }

    if (!interaction.guild || !interaction.guild.id) {
      return {
        valid: false,
        error: 'not_in_guild',
        message: 'This command can only be used in a server'
      };
    }

    return {
      valid: true,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      channelId: interaction.channelId
    };
  }

  /**
   * Validate permissions
   * @param {GuildMember} member - Guild member
   * @param {string[]} requiredPermissions - Required permission flags
   * @returns {Object} Permission validation result
   */
  static validatePermissions(member, requiredPermissions = []) {
    if (!member) {
      return {
        valid: false,
        error: 'member_not_found',
        message: 'Member not found'
      };
    }

    const missing = [];
    for (const permission of requiredPermissions) {
      if (!member.permissions.has(permission)) {
        missing.push(permission);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      hasAll: missing.length === 0,
      message: missing.length > 0 ? `Missing permissions: ${missing.join(', ')}` : null
    };
  }
}
