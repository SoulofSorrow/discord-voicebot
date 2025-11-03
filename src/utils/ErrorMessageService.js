import t from './t.js';
import config from '../../config/config.js';

/**
 * Enhanced error message service with recovery suggestions
 */
export class ErrorMessageService {
  /**
   * Get detailed error message with recovery suggestions
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {Object} Error message with recovery suggestions
   */
  static getDetailedError(errorType, context = {}) {
    const lang = config.language || 'en';
    const errors = {
      // Ownership errors
      'not_owner': {
        message: t('not_owner', lang),
        suggestion: '💡 Only the channel owner can perform this action. You can use the **Claim** button if the owner has left.',
        recoverable: true,
        action: 'claim'
      },
      'already_owner': {
        message: t('already_owner', lang),
        suggestion: 'ℹ️ You already have full control of this channel.',
        recoverable: false
      },
      'owner_still_present': {
        message: t('owner_still_present', lang),
        suggestion: '⏳ Wait for the owner to leave or ask them to use the **Transfer** button to give you ownership.',
        recoverable: true,
        action: 'transfer'
      },

      // Rate limiting
      'rate_limit_exceeded': {
        message: t('rate_limit_exceeded', lang),
        suggestion: `⏱️ You've made too many requests. Please wait ${context.waitTime || '30 seconds'} before trying again.`,
        recoverable: true,
        retryAfter: context.retryAfter || 30000
      },
      'channel_rate_limit': {
        message: 'This channel has too many active operations.',
        suggestion: '⏳ Please wait a moment for current operations to complete (typically 5-10 seconds).',
        recoverable: true,
        retryAfter: 10000
      },

      // Validation errors
      'invalid_name': {
        message: t('invalid_name', lang),
        suggestion: '📝 Channel names must be 2-100 characters and contain only letters, numbers, spaces, hyphens, and underscores.',
        recoverable: true,
        action: 'retry'
      },
      'invalid_limit': {
        message: t('invalid_limit', lang),
        suggestion: '🔢 Enter a number between 0 (unlimited) and 99.',
        recoverable: true,
        action: 'retry'
      },
      'invalid_bitrate': {
        message: t('invalid_bitrate', lang),
        suggestion: '🎵 Choose a bitrate between 8 kbps and 384 kbps. Higher values provide better audio quality but use more bandwidth.',
        recoverable: true,
        action: 'retry'
      },
      'invalid_region': {
        message: t('invalid_region', lang),
        suggestion: '🌍 Select a valid region from the list. Use **auto** for automatic selection.',
        recoverable: true,
        action: 'retry'
      },

      // User management errors
      'user_not_found': {
        message: t('user_not_found', lang),
        suggestion: '👤 The selected user is not in your voice channel. Try refreshing the list.',
        recoverable: true,
        action: 'retry'
      },
      'no_user_to_kick': {
        message: t('no_user_to_kick', lang),
        suggestion: 'ℹ️ There are no other users in the channel to kick.',
        recoverable: false
      },
      'no_user_to_transfer': {
        message: t('no_user_to_transfer', lang),
        suggestion: '👥 Invite someone to the channel first, then transfer ownership.',
        recoverable: true,
        action: 'invite'
      },
      'cannot_trust_self': {
        message: t('cannot_trust_self', lang),
        suggestion: 'ℹ️ As the owner, you already have full permissions.',
        recoverable: false
      },
      'cannot_block_admin': {
        message: t('cannot_block_admin', lang),
        suggestion: '🛡️ Server administrators have override permissions and cannot be blocked.',
        recoverable: false
      },
      'cannot_kick_higher_role': {
        message: t('cannot_kick_higher_role', lang),
        suggestion: '⬆️ This user has a higher role than you and cannot be kicked.',
        recoverable: false
      },
      'cannot_invite_blocked_user': {
        message: t('cannot_invite_blocked_user', lang),
        suggestion: '🚫 Unblock this user first using the **Unblock** button.',
        recoverable: true,
        action: 'unblock'
      },
      'user_already_in_channel': {
        message: t('user_already_in_channel', lang, context),
        suggestion: 'ℹ️ This user is already in your voice channel.',
        recoverable: false
      },

      // Permission errors
      'not_in_channel': {
        message: t('not_in_channel', lang),
        suggestion: '🔊 Join a temporary voice channel first to access the dashboard.',
        recoverable: true,
        action: 'join'
      },
      'different_channel': {
        message: t('different_channel', lang),
        suggestion: '🎯 This dashboard is for a different channel. Join that channel to use its controls.',
        recoverable: true
      },

      // Technical errors
      'error_send_invite': {
        message: t('error_send_invite', lang),
        suggestion: '📧 The user may have DMs disabled. Try mentioning them in a text channel instead.',
        recoverable: false
      },
      'error_user_dms_closed': {
        message: t('error_user_dms_closed', lang),
        suggestion: '🔒 This user has disabled DMs. Ask them to enable DMs in Privacy Settings > Direct Messages.',
        recoverable: false
      },
      'error_create_invite': {
        message: t('error_create_invite', lang),
        suggestion: '🔗 Failed to create invite link. Check bot permissions: Create Instant Invite.',
        recoverable: true,
        action: 'check_permissions'
      },
      'kick_failed': {
        message: t('kick_failed', lang, context),
        suggestion: '⚠️ Failed to disconnect user. Check bot permissions: Move Members.',
        recoverable: true,
        action: 'check_permissions'
      },
      'transfer_failed': {
        message: t('transfer_failed', lang),
        suggestion: '🔄 Failed to transfer ownership. Make sure the user is still in the channel.',
        recoverable: true,
        action: 'retry'
      },

      // Interaction errors
      'interaction_timeout': {
        message: t('interaction_timeout', lang),
        suggestion: '⏱️ The interaction expired. Click the button again to continue.',
        recoverable: true,
        action: 'retry'
      },
      'interaction_already_active': {
        message: t('interaction_already_active', lang),
        suggestion: '⚡ Complete your current action before starting a new one.',
        recoverable: true,
        retryAfter: 5000
      },
      'error_interaction': {
        message: t('error_interaction', lang),
        suggestion: '🔧 An unexpected error occurred. Try again or contact server staff if the issue persists.',
        recoverable: true,
        action: 'retry'
      },

      // Configuration errors
      'invalid_category': {
        message: t('invalid_category', lang),
        suggestion: '⚙️ Bot configuration error. Contact server staff to fix CATEGORY_CHANNEL_ID.',
        recoverable: false,
        adminOnly: true
      },
      'invalid_embed': {
        message: t('invalid_embed', lang),
        suggestion: '⚙️ Bot configuration error. Contact server staff to fix EMBED_CHANNEL_ID.',
        recoverable: false,
        adminOnly: true
      },
      'invalid_voice': {
        message: t('invalid_voice', lang),
        suggestion: '⚙️ Bot configuration error. Contact server staff to fix VOICE_CHANNEL_ID.',
        recoverable: false,
        adminOnly: true
      },

      // Database errors
      'database_error': {
        message: 'Failed to save your changes to the database.',
        suggestion: '💾 Your changes may not persist after bot restart. Contact server staff if this continues.',
        recoverable: true,
        action: 'retry'
      },
      'database_unavailable': {
        message: 'Database is temporarily unavailable.',
        suggestion: '🔄 The bot is starting up. Please wait a moment and try again.',
        recoverable: true,
        retryAfter: 5000
      }
    };

    const error = errors[errorType];
    if (!error) {
      return {
        message: t('error_interaction', lang),
        suggestion: '🔧 An unexpected error occurred. Error code: ' + errorType,
        recoverable: true,
        action: 'retry'
      };
    }

    return error;
  }

  /**
   * Format error for user display
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {string} Formatted error message
   */
  static format(errorType, context = {}) {
    const error = this.getDetailedError(errorType, context);
    let formatted = `❌ ${error.message}\n\n${error.suggestion}`;

    if (error.retryAfter) {
      const seconds = Math.ceil(error.retryAfter / 1000);
      formatted += `\n\n⏳ Retry in: ${seconds}s`;
    }

    return formatted;
  }

  /**
   * Check if error is recoverable
   * @param {string} errorType - Type of error
   * @returns {boolean} True if recoverable
   */
  static isRecoverable(errorType) {
    const error = this.getDetailedError(errorType);
    return error.recoverable || false;
  }

  /**
   * Get suggested action for error
   * @param {string} errorType - Type of error
   * @returns {string|null} Suggested action
   */
  static getSuggestedAction(errorType) {
    const error = this.getDetailedError(errorType);
    return error.action || null;
  }

  /**
   * Get retry delay for error
   * @param {string} errorType - Type of error
   * @returns {number|null} Retry delay in ms
   */
  static getRetryDelay(errorType) {
    const error = this.getDetailedError(errorType);
    return error.retryAfter || null;
  }
}
