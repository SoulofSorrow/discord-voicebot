import { MODAL_ACTIONS } from '../constants.js';
import { ValidationService } from '../utils/ValidationService.js';
import { Sanitizer } from '../utils/Sanitizer.js';
import { ErrorMessageService } from '../utils/ErrorMessageService.js';

/**
 * Modal registry with factory pattern
 * Centralized modal management and validation
 */
export class ModalRegistry {
  constructor() {
    /** @type {Map<string, ModalHandler>} Registered modal handlers */
    this.handlers = new Map();
    /** @type {Map<string, ModalSchema>} Modal validation schemas */
    this.schemas = new Map();
    /** @type {Map<string, string[]>} Modal aliases */
    this.aliases = new Map();
  }

  /**
   * Register a modal handler
   * @param {string} name - Modal name
   * @param {Object} handler - Modal handler object
   * @param {Object} schema - Validation schema (optional)
   */
  register(name, handler, schema = null) {
    if (!handler || typeof handler.execute !== 'function') {
      throw new Error(`Invalid handler for modal '${name}': missing execute function`);
    }

    this.handlers.set(name, handler);

    if (schema) {
      this.schemas.set(name, schema);
    }

    // Register aliases
    if (handler.aliases && Array.isArray(handler.aliases)) {
      for (const alias of handler.aliases) {
        this.aliases.set(alias, name);
        this.handlers.set(alias, handler);
      }
    }

    console.log(`✅ Registered modal: ${name}${handler.aliases ? ` (aliases: ${handler.aliases.join(', ')})` : ''}`);
  }

  /**
   * Get modal handler by name
   * @param {string} name - Modal name or alias
   * @returns {Object|null} Modal handler or null
   */
  get(name) {
    // Check if it's an alias first
    const actualName = this.aliases.get(name) || name;
    return this.handlers.get(actualName);
  }

  /**
   * Check if modal exists
   * @param {string} name - Modal name
   * @returns {boolean} True if exists
   */
  has(name) {
    return this.handlers.has(name) || this.aliases.has(name);
  }

  /**
   * Validate modal input
   * @param {string} name - Modal name
   * @param {Object} input - Input data to validate
   * @returns {Object} Validation result
   */
  validate(name, input) {
    const schema = this.schemas.get(name);
    if (!schema) {
      // No schema = no validation required
      return { valid: true, value: input };
    }

    return schema.validate(input);
  }

  /**
   * Execute modal with validation
   * @param {string} name - Modal name
   * @param {Interaction} interaction - Discord interaction
   * @param {Client} client - Discord client
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Execution result
   */
  async execute(name, interaction, client, options = {}) {
    const handler = this.get(name);
    if (!handler) {
      throw new Error(`Modal '${name}' not found`);
    }

    // Pre-execution validation
    if (handler.validate && typeof handler.validate === 'function') {
      const validation = await handler.validate(interaction, client);
      if (!validation.valid) {
        const errorMsg = ErrorMessageService.format(validation.error, validation.context);
        return interaction.reply({
          content: errorMsg,
          ephemeral: true,
        });
      }
    }

    // Execute handler
    try {
      return await handler.execute(interaction, client, options);
    } catch (error) {
      console.error(`Error executing modal '${name}':`, error);
      throw error;
    }
  }

  /**
   * Get all registered modals
   * @returns {Array} Array of modal names
   */
  getAll() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get modal statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalHandlers: this.handlers.size,
      totalSchemas: this.schemas.size,
      totalAliases: this.aliases.size,
      handlers: Array.from(this.handlers.keys()),
    };
  }

  /**
   * Create a modal handler from config
   * @param {Object} config - Modal configuration
   * @returns {Object} Modal handler
   */
  static createHandler(config) {
    const {
      name,
      execute,
      validate,
      schema,
      aliases = [],
      description = '',
    } = config;

    return {
      name,
      description,
      aliases,
      execute,
      validate,
      schema,
    };
  }
}

/**
 * Modal validation schemas
 */
export class ModalSchemas {
  /**
   * Channel name schema
   */
  static channelName = {
    validate(input) {
      if (!input || !input.name) {
        return {
          valid: false,
          error: 'invalid_name',
          message: 'Channel name is required',
        };
      }

      const sanitized = Sanitizer.sanitizeChannelName(input.name);
      const validation = ValidationService.validateChannelName(sanitized);

      if (!validation.valid) {
        return validation;
      }

      return {
        valid: true,
        value: validation.value,
      };
    },
  };

  /**
   * User limit schema
   */
  static userLimit = {
    validate(input) {
      if (input.limit === undefined || input.limit === null) {
        return {
          valid: false,
          error: 'invalid_limit',
          message: 'User limit is required',
        };
      }

      const validation = ValidationService.validateUserLimit(input.limit);
      return validation;
    },
  };

  /**
   * Bitrate schema
   */
  static bitrate = {
    validate(input) {
      if (!input || input.bitrate === undefined) {
        return {
          valid: false,
          error: 'invalid_bitrate',
          message: 'Bitrate is required',
        };
      }

      const validation = ValidationService.validateBitrate(input.bitrate);
      return validation;
    },
  };

  /**
   * Region schema
   */
  static region = {
    validate(input) {
      if (!input || !input.region) {
        return {
          valid: false,
          error: 'invalid_region',
          message: 'Region is required',
        };
      }

      const validation = ValidationService.validateRegion(input.region);
      return validation;
    },
  };

  /**
   * User ID schema
   */
  static userId = {
    validate(input) {
      if (!input || !input.userId) {
        return {
          valid: false,
          error: 'invalid_user',
          message: 'User ID is required',
        };
      }

      const sanitized = Sanitizer.sanitizeUserId(input.userId);
      if (!sanitized) {
        return {
          valid: false,
          error: 'invalid_user',
          message: 'Invalid user ID format',
        };
      }

      return {
        valid: true,
        value: sanitized,
      };
    },
  };

  /**
   * Preset schema
   */
  static preset = {
    validate(input) {
      if (!input || !input.preset) {
        return {
          valid: false,
          error: 'invalid_preset',
          message: 'Preset name is required',
        };
      }

      const validPresets = [
        'default', 'vip', 'gaming', 'music', 'study',
        'party', 'meeting', 'private', 'open', 'podcast',
      ];

      if (!validPresets.includes(input.preset)) {
        return {
          valid: false,
          error: 'invalid_preset',
          message: 'Unknown preset',
          hint: `Valid presets: ${validPresets.join(', ')}`,
        };
      }

      return {
        valid: true,
        value: input.preset,
      };
    },
  };
}

/**
 * Modal factory for creating modals programmatically
 */
export class ModalFactory {
  /**
   * Create a text input modal
   * @param {Object} config - Modal configuration
   * @returns {Object} Modal object
   */
  static createTextInputModal(config) {
    const {
      customId,
      title,
      fields = [],
    } = config;

    return {
      type: 'modal',
      customId,
      title,
      components: fields.map(field => ({
        type: 1, // Action Row
        components: [{
          type: 4, // Text Input
          customId: field.id,
          label: field.label,
          style: field.multiline ? 2 : 1, // Paragraph : Short
          minLength: field.minLength,
          maxLength: field.maxLength,
          required: field.required !== false,
          value: field.defaultValue,
          placeholder: field.placeholder,
        }],
      })),
    };
  }

  /**
   * Create a select menu modal
   * @param {Object} config - Modal configuration
   * @returns {Object} Modal object
   */
  static createSelectMenuModal(config) {
    const {
      customId,
      placeholder,
      options = [],
      minValues = 1,
      maxValues = 1,
    } = config;

    return {
      type: 3, // Select Menu
      customId,
      placeholder,
      minValues,
      maxValues,
      options,
    };
  }
}

// Export singleton instance
export const modalRegistry = new ModalRegistry();
export default modalRegistry;
