import databaseService from './DatabaseService.js';
import monitoringService from './MonitoringService.js';
import { rateLimiter } from '../utils/RateLimiter.js';

/**
 * Analytics service for tracking and reporting bot metrics
 * Provides insights into bot usage and performance
 */
export class AnalyticsService {
  /**
   * Get channel statistics
   * @param {Client} client - Discord client
   * @param {Object} options - Query options
   * @returns {Object} Channel statistics
   */
  static getChannelStats(client, options = {}) {
    const { guildId, timeRange = 24 * 60 * 60 * 1000 } = options;
    const since = Date.now() - timeRange;

    const stats = {
      active: client.tempVoiceOwners?.size || 0,
      total: 0,
      byGuild: {},
      byOwner: {},
      avgLifetime: 0,
    };

    if (databaseService.initialized) {
      // Get total channels created
      const totalQuery = guildId
        ? databaseService.db.prepare('SELECT COUNT(*) as count FROM channels WHERE guild_id = ?')
        : databaseService.db.prepare('SELECT COUNT(*) as count FROM channels');

      stats.total = guildId ? totalQuery.get(guildId).count : totalQuery.get().count;

      // Get channels by guild
      const byGuildQuery = databaseService.db.prepare(`
        SELECT guild_id, COUNT(*) as count
        FROM channels
        GROUP BY guild_id
      `);

      for (const row of byGuildQuery.all()) {
        stats.byGuild[row.guild_id] = row.count;
      }

      // Get channels by owner
      const byOwnerQuery = databaseService.db.prepare(`
        SELECT owner_id, COUNT(*) as count
        FROM channels
        GROUP BY owner_id
        ORDER BY count DESC
        LIMIT 10
      `);

      for (const row of byOwnerQuery.all()) {
        stats.byOwner[row.owner_id] = row.count;
      }
    }

    return stats;
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID (optional)
   * @returns {Object} User statistics
   */
  static getUserStats(userId = null) {
    if (!databaseService.initialized) {
      return { error: 'Database not available' };
    }

    if (userId) {
      // Stats for specific user
      const channelsCreated = databaseService.db.prepare(`
        SELECT COUNT(*) as count FROM channels WHERE owner_id = ?
      `).get(userId).count;

      const currentOwned = databaseService.db.prepare(`
        SELECT channel_id FROM channels WHERE owner_id = ?
      `).all(userId);

      const permissions = databaseService.db.prepare(`
        SELECT permission_type, COUNT(*) as count
        FROM channel_permissions
        WHERE user_id = ?
        GROUP BY permission_type
      `).all(userId);

      const stats = {
        userId,
        channelsCreated,
        currentlyOwned: currentOwned.length,
        permissions: {},
      };

      for (const perm of permissions) {
        stats.permissions[perm.permission_type] = perm.count;
      }

      return stats;
    }

    // Global user stats
    const topCreators = databaseService.db.prepare(`
      SELECT owner_id, COUNT(*) as count
      FROM channels
      GROUP BY owner_id
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const mostTrusted = databaseService.db.prepare(`
      SELECT user_id, COUNT(*) as count
      FROM channel_permissions
      WHERE permission_type = 'trust'
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const mostBlocked = databaseService.db.prepare(`
      SELECT user_id, COUNT(*) as count
      FROM channel_permissions
      WHERE permission_type = 'block'
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `).all();

    return {
      topCreators: topCreators.map(row => ({
        userId: row.user_id,
        channelsCreated: row.count,
      })),
      mostTrusted: mostTrusted.map(row => ({
        userId: row.user_id,
        trustCount: row.count,
      })),
      mostBlocked: mostBlocked.map(row => ({
        userId: row.user_id,
        blockCount: row.count,
      })),
    };
  }

  /**
   * Get interaction statistics
   * @param {Object} options - Query options
   * @returns {Object} Interaction statistics
   */
  static getInteractionStats(options = {}) {
    const { timeRange = 24 * 60 * 60 * 1000 } = options;
    const since = Date.now() - timeRange;

    if (!databaseService.initialized) {
      return { error: 'Database not available' };
    }

    const interactions = databaseService.db.prepare(`
      SELECT metric_value, recorded_at
      FROM metrics
      WHERE metric_type = 'interaction'
      AND recorded_at >= ?
      ORDER BY recorded_at DESC
    `).all(since);

    const byType = {};
    let total = 0;

    for (const row of interactions) {
      const data = JSON.parse(row.metric_value);
      const type = data.type || 'unknown';

      byType[type] = (byType[type] || 0) + 1;
      total++;
    }

    return {
      total,
      byType,
      timeRange: timeRange / 1000 / 60, // in minutes
    };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  static getPerformanceMetrics() {
    return {
      monitoring: monitoringService.getStats ? monitoringService.getStats() : {},
      rateLimits: rateLimiter.getStats(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }

  /**
   * Get error statistics
   * @param {Object} options - Query options
   * @returns {Object} Error statistics
   */
  static getErrorStats(options = {}) {
    const { timeRange = 24 * 60 * 60 * 1000 } = options;
    const since = Date.now() - timeRange;

    if (!databaseService.initialized) {
      return { error: 'Database not available' };
    }

    const errors = databaseService.db.prepare(`
      SELECT metric_value, recorded_at
      FROM metrics
      WHERE metric_type = 'error'
      AND recorded_at >= ?
      ORDER BY recorded_at DESC
    `).all(since);

    const byContext = {};
    let total = 0;

    for (const row of errors) {
      const data = JSON.parse(row.metric_value);
      const context = data.context || 'unknown';

      byContext[context] = (byContext[context] || 0) + 1;
      total++;
    }

    return {
      total,
      byContext,
      timeRange: timeRange / 1000 / 60, // in minutes
      errorRate: total / (timeRange / 1000 / 60), // errors per minute
    };
  }

  /**
   * Get comprehensive analytics dashboard data
   * @param {Client} client - Discord client
   * @param {Object} options - Query options
   * @returns {Object} Complete analytics data
   */
  static getDashboardData(client, options = {}) {
    const timeRange = options.timeRange || 24 * 60 * 60 * 1000; // 24 hours default

    return {
      timestamp: Date.now(),
      timeRange,
      channels: this.getChannelStats(client, { timeRange }),
      users: this.getUserStats(),
      interactions: this.getInteractionStats({ timeRange }),
      performance: this.getPerformanceMetrics(),
      errors: this.getErrorStats({ timeRange }),
    };
  }

  /**
   * Get activity timeline
   * @param {Object} options - Query options
   * @returns {Array} Timeline data
   */
  static getActivityTimeline(options = {}) {
    const { timeRange = 24 * 60 * 60 * 1000, interval = 60 * 60 * 1000 } = options;
    const since = Date.now() - timeRange;

    if (!databaseService.initialized) {
      return [];
    }

    const buckets = Math.ceil(timeRange / interval);
    const timeline = new Array(buckets).fill(0).map((_, i) => ({
      timestamp: since + (i * interval),
      channelsCreated: 0,
      channelsDeleted: 0,
      interactions: 0,
      errors: 0,
    }));

    const metrics = databaseService.db.prepare(`
      SELECT metric_type, metric_value, recorded_at
      FROM metrics
      WHERE recorded_at >= ?
      ORDER BY recorded_at ASC
    `).all(since);

    for (const row of metrics) {
      const bucketIndex = Math.floor((row.recorded_at - since) / interval);
      if (bucketIndex >= 0 && bucketIndex < buckets) {
        const data = JSON.parse(row.metric_value);

        if (row.metric_type === 'channel_created') {
          timeline[bucketIndex].channelsCreated++;
        } else if (row.metric_type === 'channel_deleted') {
          timeline[bucketIndex].channelsDeleted++;
        } else if (row.metric_type === 'interaction') {
          timeline[bucketIndex].interactions++;
        } else if (row.metric_type === 'error') {
          timeline[bucketIndex].errors++;
        }
      }
    }

    return timeline;
  }

  /**
   * Export analytics report
   * @param {Client} client - Discord client
   * @param {Object} options - Export options
   * @returns {Object} Analytics report
   */
  static exportReport(client, options = {}) {
    const { format = 'json', timeRange = 7 * 24 * 60 * 60 * 1000 } = options;

    const report = {
      generated: new Date().toISOString(),
      timeRange: {
        duration: timeRange,
        from: new Date(Date.now() - timeRange).toISOString(),
        to: new Date().toISOString(),
      },
      data: this.getDashboardData(client, { timeRange }),
      timeline: this.getActivityTimeline({ timeRange, interval: 60 * 60 * 1000 }),
    };

    if (format === 'csv') {
      // TODO: Implement CSV export
      return { error: 'CSV format not yet implemented' };
    }

    return report;
  }
}

export default AnalyticsService;
