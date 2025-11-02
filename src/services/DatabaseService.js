import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logStartup } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the database connection and create tables
   */
  initialize() {
    try {
      // Ensure data directory exists
      const dataDir = join(process.cwd(), 'data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      // Create database connection
      const dbPath = join(dataDir, 'tempvoice.db');
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL'); // Better concurrency

      logStartup('📦 Database connection established');

      // Create tables
      this.createTables();

      this.initialized = true;
      logStartup('✅ Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create database tables with proper schema
   */
  createTables() {
    // Channels table - stores active temp channels
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        settings TEXT DEFAULT '{}',
        INDEX idx_guild (guild_id),
        INDEX idx_owner (owner_id)
      )
    `);

    // Channel permissions - stores trust/block lists per channel
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS channel_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        permission_type TEXT NOT NULL CHECK(permission_type IN ('trust', 'block')),
        created_at INTEGER NOT NULL,
        UNIQUE(channel_id, user_id, permission_type),
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
      )
    `);

    // Create index for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_channel_permissions
      ON channel_permissions(channel_id, permission_type)
    `);

    // Metrics table - persistent statistics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL,
        metric_value TEXT NOT NULL,
        recorded_at INTEGER NOT NULL,
        INDEX idx_metric_type (metric_type),
        INDEX idx_recorded_at (recorded_at)
      )
    `);

    logStartup('📋 Database tables created/verified');
  }

  /**
   * Get channel data by channel ID
   * @param {string} channelId - Discord channel ID
   * @returns {object|null} Channel data or null
   */
  getChannel(channelId) {
    if (!this.initialized) return null;

    const stmt = this.db.prepare('SELECT * FROM channels WHERE channel_id = ?');
    const row = stmt.get(channelId);

    if (row) {
      return {
        channelId: row.channel_id,
        guildId: row.guild_id,
        ownerId: row.owner_id,
        createdAt: row.created_at,
        settings: JSON.parse(row.settings || '{}')
      };
    }
    return null;
  }

  /**
   * Get all channels for a specific guild
   * @param {string} guildId - Discord guild ID
   * @returns {Array} Array of channel data
   */
  getChannelsByGuild(guildId) {
    if (!this.initialized) return [];

    const stmt = this.db.prepare('SELECT * FROM channels WHERE guild_id = ?');
    const rows = stmt.all(guildId);

    return rows.map(row => ({
      channelId: row.channel_id,
      guildId: row.guild_id,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      settings: JSON.parse(row.settings || '{}')
    }));
  }

  /**
   * Save or update channel data
   * @param {string} channelId - Discord channel ID
   * @param {string} guildId - Discord guild ID
   * @param {string} ownerId - Discord user ID of owner
   * @param {object} settings - Additional settings
   */
  saveChannel(channelId, guildId, ownerId, settings = {}) {
    if (!this.initialized) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO channels (channel_id, guild_id, owner_id, created_at, settings)
      VALUES (?, ?, ?, ?, ?)
    `);

    const createdAt = Date.now();
    stmt.run(channelId, guildId, ownerId, createdAt, JSON.stringify(settings));

    logStartup(`💾 Saved channel ${channelId} to database`);
  }

  /**
   * Delete channel from database
   * @param {string} channelId - Discord channel ID
   */
  deleteChannel(channelId) {
    if (!this.initialized) return;

    const stmt = this.db.prepare('DELETE FROM channels WHERE channel_id = ?');
    const result = stmt.run(channelId);

    if (result.changes > 0) {
      logStartup(`🗑️ Deleted channel ${channelId} from database`);
    }
  }

  /**
   * Add permission (trust/block) for a user
   * @param {string} channelId - Discord channel ID
   * @param {string} userId - Discord user ID
   * @param {string} type - 'trust' or 'block'
   */
  addPermission(channelId, userId, type) {
    if (!this.initialized) return;

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO channel_permissions (channel_id, user_id, permission_type, created_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(channelId, userId, type, Date.now());
  }

  /**
   * Remove permission for a user
   * @param {string} channelId - Discord channel ID
   * @param {string} userId - Discord user ID
   * @param {string} type - 'trust' or 'block'
   */
  removePermission(channelId, userId, type) {
    if (!this.initialized) return;

    const stmt = this.db.prepare(`
      DELETE FROM channel_permissions
      WHERE channel_id = ? AND user_id = ? AND permission_type = ?
    `);

    stmt.run(channelId, userId, type);
  }

  /**
   * Get all permissions for a channel
   * @param {string} channelId - Discord channel ID
   * @param {string} type - 'trust' or 'block' (optional)
   * @returns {Array} Array of user IDs
   */
  getPermissions(channelId, type = null) {
    if (!this.initialized) return [];

    let stmt;
    let rows;

    if (type) {
      stmt = this.db.prepare(`
        SELECT user_id FROM channel_permissions
        WHERE channel_id = ? AND permission_type = ?
      `);
      rows = stmt.all(channelId, type);
    } else {
      stmt = this.db.prepare(`
        SELECT user_id, permission_type FROM channel_permissions
        WHERE channel_id = ?
      `);
      rows = stmt.all(channelId);
    }

    return rows.map(row => ({
      userId: row.user_id,
      type: row.permission_type || type
    }));
  }

  /**
   * Update channel owner
   * @param {string} channelId - Discord channel ID
   * @param {string} newOwnerId - New owner user ID
   */
  updateChannelOwner(channelId, newOwnerId) {
    if (!this.initialized) return;

    const stmt = this.db.prepare(`
      UPDATE channels SET owner_id = ? WHERE channel_id = ?
    `);

    stmt.run(newOwnerId, channelId);
    logStartup(`🔄 Updated owner for channel ${channelId}`);
  }

  /**
   * Save metric data
   * @param {string} type - Metric type
   * @param {any} value - Metric value
   */
  saveMetric(type, value) {
    if (!this.initialized) return;

    const stmt = this.db.prepare(`
      INSERT INTO metrics (metric_type, metric_value, recorded_at)
      VALUES (?, ?, ?)
    `);

    stmt.run(type, JSON.stringify(value), Date.now());
  }

  /**
   * Get metrics by type and time range
   * @param {string} type - Metric type
   * @param {number} since - Timestamp (optional)
   * @returns {Array} Array of metrics
   */
  getMetrics(type, since = 0) {
    if (!this.initialized) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM metrics
      WHERE metric_type = ? AND recorded_at >= ?
      ORDER BY recorded_at DESC
      LIMIT 1000
    `);

    const rows = stmt.all(type, since);

    return rows.map(row => ({
      type: row.metric_type,
      value: JSON.parse(row.metric_value),
      recordedAt: row.recorded_at
    }));
  }

  /**
   * Clean up old metrics (older than 30 days)
   */
  cleanupOldMetrics() {
    if (!this.initialized) return;

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const stmt = this.db.prepare('DELETE FROM metrics WHERE recorded_at < ?');
    const result = stmt.run(thirtyDaysAgo);

    if (result.changes > 0) {
      logStartup(`🧹 Cleaned up ${result.changes} old metrics`);
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.initialized = false;
      logStartup('📦 Database connection closed');
    }
  }

  /**
   * Execute transaction with rollback support
   * @param {Function} callback - Function to execute in transaction
   */
  transaction(callback) {
    if (!this.initialized) return;

    const trans = this.db.transaction(callback);
    return trans();
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
