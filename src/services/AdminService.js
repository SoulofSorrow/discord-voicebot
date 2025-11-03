import { PermissionFlagsBits } from 'discord.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { cache } from '../utils/CacheManager.js';
import databaseService from './DatabaseService.js';
import monitoringService from './MonitoringService.js';
import { logger } from '../utils/StructuredLogger.js';

/**
 * Admin service for privileged operations
 * Provides admin-only commands and override capabilities
 */
export class AdminService {
  /**
   * Check if user is an admin
   * @param {GuildMember} member - Guild member to check
   * @returns {boolean} True if admin
   */
  static isAdmin(member) {
    if (!member || !member.permissions) {
      return false;
    }

    return (
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      member.permissions.has(PermissionFlagsBits.ManageChannels)
    );
  }

  /**
   * Force delete a channel (admin override)
   * @param {Client} client - Discord client
   * @param {string} channelId - Channel ID to delete
   * @param {GuildMember} admin - Admin performing action
   * @returns {Promise<Object>} Result
   */
  static async forceDeleteChannel(client, channelId, admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        return {
          success: false,
          reason: 'Channel not found',
        };
      }

      const channelName = channel.name;
      const ownerId = client.tempVoiceOwners?.get(channelId);

      await channel.delete();

      // Cleanup
      if (client.tempVoiceOwners) {
        client.tempVoiceOwners.delete(channelId);
      }
      databaseService.deleteChannel(channelId);

      logger.warn('Admin forced channel deletion', {
        adminId: admin.id,
        adminName: admin.user.username,
        channelId,
        channelName,
        ownerId,
      });

      return {
        success: true,
        channelName,
        ownerId,
      };
    } catch (error) {
      logger.error('Failed to force delete channel', {
        error,
        channelId,
        adminId: admin.id,
      });
      throw error;
    }
  }

  /**
   * Transfer ownership (admin override)
   * @param {Client} client - Discord client
   * @param {string} channelId - Channel ID
   * @param {string} newOwnerId - New owner ID
   * @param {GuildMember} admin - Admin performing action
   * @returns {Promise<Object>} Result
   */
  static async forceTransferOwnership(client, channelId, newOwnerId, admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    try {
      const oldOwnerId = client.tempVoiceOwners?.get(channelId);

      client.tempVoiceOwners.set(channelId, newOwnerId);
      databaseService.updateChannelOwner(channelId, newOwnerId);

      logger.warn('Admin forced ownership transfer', {
        adminId: admin.id,
        adminName: admin.user.username,
        channelId,
        oldOwnerId,
        newOwnerId,
      });

      return {
        success: true,
        oldOwnerId,
        newOwnerId,
      };
    } catch (error) {
      logger.error('Failed to force transfer ownership', {
        error,
        channelId,
        adminId: admin.id,
      });
      throw error;
    }
  }

  /**
   * Reset rate limits for a user (admin override)
   * @param {string} userId - User ID
   * @param {GuildMember} admin - Admin performing action
   * @returns {Object} Result
   */
  static resetUserRateLimit(userId, admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    rateLimiter.resetAllUserLimits(userId);

    logger.info('Admin reset user rate limits', {
      adminId: admin.id,
      adminName: admin.user.username,
      targetUserId: userId,
    });

    return {
      success: true,
      userId,
    };
  }

  /**
   * Clear all caches (admin command)
   * @param {GuildMember} admin - Admin performing action
   * @returns {Object} Result
   */
  static clearCaches(admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    const before = cache.cache.size;
    cache.clear();

    logger.warn('Admin cleared all caches', {
      adminId: admin.id,
      adminName: admin.user.username,
      entriesCleared: before,
    });

    return {
      success: true,
      entriesCleared: before,
    };
  }

  /**
   * Reload configuration without restart (admin command)
   * @param {GuildMember} admin - Admin performing action
   * @returns {Promise<Object>} Result
   */
  static async reloadConfig(admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    try {
      // Clear Node's require cache for config
      const configPath = new URL('../../config/config.js', import.meta.url).pathname;
      delete import.meta.cache?.[configPath];

      // Re-import config
      const { default: newConfig } = await import(`../../config/config.js?t=${Date.now()}`);

      logger.info('Admin reloaded configuration', {
        adminId: admin.id,
        adminName: admin.user.username,
      });

      return {
        success: true,
        config: {
          language: newConfig.language,
          log: newConfig.log,
          label: newConfig.label,
        },
      };
    } catch (error) {
      logger.error('Failed to reload config', {
        error,
        adminId: admin.id,
      });
      throw error;
    }
  }

  /**
   * Get system statistics (admin command)
   * @param {Client} client - Discord client
   * @param {GuildMember} admin - Admin performing action
   * @returns {Object} System stats
   */
  static getSystemStats(client, admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    const stats = {
      bot: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
      channels: {
        active: client.tempVoiceOwners?.size || 0,
        inDatabase: databaseService.initialized
          ? databaseService.db.prepare('SELECT COUNT(*) as count FROM channels').get().count
          : 0,
      },
      cache: {
        size: cache.cache.size,
      },
      rateLimits: rateLimiter.getStats(),
      monitoring: monitoringService.checkReadiness(),
    };

    logger.info('Admin requested system stats', {
      adminId: admin.id,
      adminName: admin.user.username,
    });

    return stats;
  }

  /**
   * Cleanup orphaned channels (admin command)
   * @param {Client} client - Discord client
   * @param {GuildMember} admin - Admin performing action
   * @returns {Promise<Object>} Result
   */
  static async cleanupOrphanedChannels(client, admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    try {
      const guild = admin.guild;
      const categoryId = process.env.CATEGORY_CHANNEL_ID;
      const category = await guild.channels.fetch(categoryId);

      if (!category) {
        throw new Error('Category not found');
      }

      const orphaned = [];
      for (const [channelId, channel] of category.children.cache) {
        if (channel.members.size === 0 && client.tempVoiceOwners?.has(channelId)) {
          orphaned.push(channelId);
          await channel.delete();
          client.tempVoiceOwners.delete(channelId);
          databaseService.deleteChannel(channelId);
        }
      }

      logger.warn('Admin cleaned up orphaned channels', {
        adminId: admin.id,
        adminName: admin.user.username,
        channelsDeleted: orphaned.length,
        channels: orphaned,
      });

      return {
        success: true,
        channelsDeleted: orphaned.length,
        channels: orphaned,
      };
    } catch (error) {
      logger.error('Failed to cleanup orphaned channels', {
        error,
        adminId: admin.id,
      });
      throw error;
    }
  }

  /**
   * Export database (admin command)
   * @param {GuildMember} admin - Admin performing action
   * @returns {Object} Database export
   */
  static exportDatabase(admin) {
    if (!this.isAdmin(admin)) {
      throw new Error('Insufficient permissions');
    }

    if (!databaseService.initialized) {
      throw new Error('Database not initialized');
    }

    const channels = databaseService.db.prepare('SELECT * FROM channels').all();
    const permissions = databaseService.db.prepare('SELECT * FROM channel_permissions').all();
    const metrics = databaseService.db.prepare('SELECT * FROM metrics ORDER BY recorded_at DESC LIMIT 1000').all();

    logger.warn('Admin exported database', {
      adminId: admin.id,
      adminName: admin.user.username,
      channelCount: channels.length,
      permissionCount: permissions.length,
      metricCount: metrics.length,
    });

    return {
      timestamp: Date.now(),
      channels,
      permissions,
      metrics,
    };
  }

  /**
   * Get admin command help
   * @returns {Array} Array of commands with descriptions
   */
  static getCommands() {
    return [
      {
        name: 'force-delete',
        description: 'Force delete a channel (admin override)',
        usage: '/admin force-delete <channelId>',
      },
      {
        name: 'force-transfer',
        description: 'Force transfer channel ownership',
        usage: '/admin force-transfer <channelId> <newOwnerId>',
      },
      {
        name: 'reset-ratelimit',
        description: 'Reset rate limits for a user',
        usage: '/admin reset-ratelimit <userId>',
      },
      {
        name: 'clear-cache',
        description: 'Clear all caches',
        usage: '/admin clear-cache',
      },
      {
        name: 'reload-config',
        description: 'Reload configuration without restart',
        usage: '/admin reload-config',
      },
      {
        name: 'stats',
        description: 'Get system statistics',
        usage: '/admin stats',
      },
      {
        name: 'cleanup',
        description: 'Cleanup orphaned channels',
        usage: '/admin cleanup',
      },
      {
        name: 'export-db',
        description: 'Export database (channels, permissions, metrics)',
        usage: '/admin export-db',
      },
    ];
  }
}

export default AdminService;
