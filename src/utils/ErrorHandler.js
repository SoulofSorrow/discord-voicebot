import { MessageFlags } from 'discord-api-types/v10';
import * as Sentry from '@sentry/node';
import t from './t.js';
import config from '../../config/config.js';

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    integrations: [
      // Add profiling integration if needed
    ],
  });
  console.log('✅ Sentry initialized');
}

export class ErrorHandler {
  static async handle(error, interaction, client, context = '') {
    console.error(`[${context}] ${new Date().toISOString()}`, error.message || error);

    // Log to monitoring service
    this.logToService(error, context, interaction);

    if (interaction && !interaction.replied && !interaction.deferred) {
      const errorMsg = t('error_interaction', config.language);
      await interaction.reply({
        content: errorMsg,
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }

  static logToService(error, context, interaction = null) {
    // Sentry integration
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          context: context,
          guild: interaction?.guildId || 'unknown',
        },
        user: interaction ? {
          id: interaction.user?.id,
          username: interaction.user?.username,
        } : undefined,
        level: 'error',
      });
    }
  }

  static async handlePromise(promise, interaction, client, context) {
    try {
      return await promise;
    } catch (error) {
      await this.handle(error, interaction, client, context);
      throw error;
    }
  }

  static captureMessage(message, level = 'info', context = {}) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level: level,
        tags: context,
      });
    }
  }
}
