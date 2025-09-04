import { ValidationService } from './ValidationService.js';
import { metrics } from './MetricsCollector.js';
import { cache } from './CacheManager.js';

export class OwnershipManager {
  static check(client, channelId, userId) {
    if (!client?.tempVoiceOwners || !channelId || !userId) {
      return false;
    }

    return client.tempVoiceOwners.get(channelId) === userId;
  }

  static async transfer(client, channelId, newOwnerId) {
    if (!this.validateTransfer(client, channelId, newOwnerId)) {
      throw new Error('Invalid ownership transfer');
    }

    const oldOwnerId = client.tempVoiceOwners.get(channelId);
    client.tempVoiceOwners.set(channelId, newOwnerId);

    // Optional: Persist to database
    if (client.database) {
      await client.database.updateOwner(channelId, newOwnerId);
    }

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
      client.tempVoiceOwners.delete(channelId);

      // Optional: Cleanup from database
      if (client.database) {
        client.database.removeChannel(channelId).catch(console.error);
      }

      // Clear cache
      cache.cache.forEach((_, key) => {
        if (key.includes(channelId)) {
          cache.cache.delete(key);
        }
      });
    }
  }
}
