import { ValidationService } from './ValidationService.js';
import { metrics } from './MetricsCollector.js';
import { cache } from './CacheManager.js';
import databaseService from '../services/DatabaseService.js';

export class OwnershipManager {
  static check(client, channelId, userId) {
    if (!client?.tempVoiceOwners || !channelId || !userId) {
      return false;
    }

    // Check in-memory first (faster)
    const memoryOwner = client.tempVoiceOwners.get(channelId);
    if (memoryOwner) {
      return memoryOwner === userId;
    }

    // Fallback to database if not in memory
    const dbChannel = databaseService.getChannel(channelId);
    if (dbChannel) {
      // Restore to memory for faster subsequent lookups
      client.tempVoiceOwners.set(channelId, dbChannel.ownerId);
      return dbChannel.ownerId === userId;
    }

    return false;
  }

  static async transfer(client, channelId, newOwnerId) {
    if (!this.validateTransfer(client, channelId, newOwnerId)) {
      throw new Error('Invalid ownership transfer');
    }

    const oldOwnerId = client.tempVoiceOwners.get(channelId);

    // Update in memory
    client.tempVoiceOwners.set(channelId, newOwnerId);

    // Persist to database
    databaseService.updateChannelOwner(channelId, newOwnerId);

    metrics.recordInteraction('transfer');
    return { oldOwnerId, newOwnerId };
  }

  static validateTransfer(client, channelId, newOwnerId) {
    return client?.tempVoiceOwners?.has(channelId) &&
           newOwnerId &&
           typeof newOwnerId === 'string' &&
           ValidationService.validateUserId(newOwnerId);
  }

  static cleanup(client, channelId) {
    if (client?.tempVoiceOwners?.has(channelId)) {
      // Remove from memory
      client.tempVoiceOwners.delete(channelId);

      // Remove from database
      databaseService.deleteChannel(channelId);

      // Clear cache
      cache.cache.forEach((_, key) => {
        if (key.includes(channelId)) {
          cache.cache.delete(key);
        }
      });
    }
  }

  static register(client, channelId, ownerId, guildId) {
    // Register in memory
    client.tempVoiceOwners.set(channelId, ownerId);

    // Persist to database
    databaseService.saveChannel(channelId, guildId, ownerId);
  }
}
