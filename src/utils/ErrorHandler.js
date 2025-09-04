import { MessageFlags } from 'discord-api-types/v10';
import t from './t.js';
import config from '../../config/config.js';

export class ErrorHandler {
  static async handle(error, interaction, client, context = '') {
    console.error(`[${context}] ${new Date().toISOString()}`, error.message || error);
    
    // Log to file or monitoring service
    this.logToService(error, context);
    
    if (interaction && !interaction.replied && !interaction.deferred) {
      const errorMsg = t('error_interaction', config.language);
      await interaction.reply({ 
        content: errorMsg, 
        flags: MessageFlags.Ephemeral 
      }).catch(() => {});
    }
  }
  
  static logToService(error, context) {
    // Integration für Monitoring Services wie Sentry
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { tags: { context } });
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
}
