import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import databaseService from '../src/services/DatabaseService.js';

describe('DatabaseService', () => {
  const testDbPath = join(process.cwd(), 'data', 'tempvoice.db');

  beforeEach(() => {
    // Clean up test database if exists
    if (existsSync(testDbPath)) {
      try {
        databaseService.close();
        unlinkSync(testDbPath);
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }

    // Initialize fresh database
    databaseService.initialize();
  });

  afterEach(() => {
    databaseService.close();
  });

  describe('initialization', () => {
    it('should create database file', () => {
      assert.ok(databaseService.initialized);
      assert.ok(databaseService.db);
    });

    it('should create required tables', () => {
      const tables = databaseService.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table'
      `).all();

      const tableNames = tables.map(t => t.name);
      assert.ok(tableNames.includes('channels'));
      assert.ok(tableNames.includes('channel_permissions'));
      assert.ok(tableNames.includes('metrics'));
    });
  });

  describe('channel operations', () => {
    it('should save and retrieve channels', () => {
      databaseService.saveChannel('channel123', 'guild456', 'user789');

      const channel = databaseService.getChannel('channel123');
      assert.strictEqual(channel.channelId, 'channel123');
      assert.strictEqual(channel.guildId, 'guild456');
      assert.strictEqual(channel.ownerId, 'user789');
    });

    it('should return null for non-existent channels', () => {
      const channel = databaseService.getChannel('non-existent');
      assert.strictEqual(channel, null);
    });

    it('should update existing channels', () => {
      databaseService.saveChannel('channel123', 'guild456', 'user789');
      databaseService.saveChannel('channel123', 'guild456', 'user999', { custom: 'data' });

      const channel = databaseService.getChannel('channel123');
      assert.strictEqual(channel.ownerId, 'user999');
      assert.deepStrictEqual(channel.settings, { custom: 'data' });
    });

    it('should delete channels', () => {
      databaseService.saveChannel('channel123', 'guild456', 'user789');
      databaseService.deleteChannel('channel123');

      const channel = databaseService.getChannel('channel123');
      assert.strictEqual(channel, null);
    });

    it('should get channels by guild', () => {
      databaseService.saveChannel('channel1', 'guild456', 'user1');
      databaseService.saveChannel('channel2', 'guild456', 'user2');
      databaseService.saveChannel('channel3', 'guild789', 'user3');

      const channels = databaseService.getChannelsByGuild('guild456');
      assert.strictEqual(channels.length, 2);
      assert.ok(channels.some(c => c.channelId === 'channel1'));
      assert.ok(channels.some(c => c.channelId === 'channel2'));
    });

    it('should update channel owner', () => {
      databaseService.saveChannel('channel123', 'guild456', 'user789');
      databaseService.updateChannelOwner('channel123', 'user999');

      const channel = databaseService.getChannel('channel123');
      assert.strictEqual(channel.ownerId, 'user999');
    });
  });

  describe('permission operations', () => {
    beforeEach(() => {
      databaseService.saveChannel('channel123', 'guild456', 'user789');
    });

    it('should add and retrieve permissions', () => {
      databaseService.addPermission('channel123', 'user111', 'trust');
      databaseService.addPermission('channel123', 'user222', 'block');

      const permissions = databaseService.getPermissions('channel123');
      assert.strictEqual(permissions.length, 2);
    });

    it('should get permissions by type', () => {
      databaseService.addPermission('channel123', 'user111', 'trust');
      databaseService.addPermission('channel123', 'user222', 'block');

      const trusted = databaseService.getPermissions('channel123', 'trust');
      const blocked = databaseService.getPermissions('channel123', 'block');

      assert.strictEqual(trusted.length, 1);
      assert.strictEqual(blocked.length, 1);
      assert.strictEqual(trusted[0].userId, 'user111');
      assert.strictEqual(blocked[0].userId, 'user222');
    });

    it('should remove permissions', () => {
      databaseService.addPermission('channel123', 'user111', 'trust');
      databaseService.removePermission('channel123', 'user111', 'trust');

      const permissions = databaseService.getPermissions('channel123', 'trust');
      assert.strictEqual(permissions.length, 0);
    });

    it('should cascade delete permissions when channel is deleted', () => {
      databaseService.addPermission('channel123', 'user111', 'trust');
      databaseService.deleteChannel('channel123');

      const permissions = databaseService.getPermissions('channel123');
      assert.strictEqual(permissions.length, 0);
    });
  });

  describe('metrics operations', () => {
    it('should save and retrieve metrics', () => {
      databaseService.saveMetric('test-metric', { value: 123 });

      const metrics = databaseService.getMetrics('test-metric');
      assert.strictEqual(metrics.length, 1);
      assert.deepStrictEqual(metrics[0].value, { value: 123 });
    });

    it('should filter metrics by timestamp', () => {
      const now = Date.now();

      databaseService.saveMetric('test-metric', { value: 1 });

      // Wait a bit
      const future = now + 100;

      const metrics = databaseService.getMetrics('test-metric', future);
      assert.strictEqual(metrics.length, 0);
    });

    it('should cleanup old metrics', () => {
      // Insert old metric (31 days ago)
      const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000);
      databaseService.db.prepare(`
        INSERT INTO metrics (metric_type, metric_value, recorded_at)
        VALUES (?, ?, ?)
      `).run('old-metric', JSON.stringify({ value: 1 }), oldTimestamp);

      // Insert recent metric
      databaseService.saveMetric('new-metric', { value: 2 });

      // Cleanup old metrics
      databaseService.cleanupOldMetrics();

      const allMetrics = databaseService.db.prepare('SELECT * FROM metrics').all();
      assert.strictEqual(allMetrics.length, 1);
      assert.strictEqual(allMetrics[0].metric_type, 'new-metric');
    });
  });

  describe('transactions', () => {
    it('should execute transactions atomically', () => {
      const transaction = databaseService.transaction(() => {
        databaseService.saveChannel('channel1', 'guild1', 'user1');
        databaseService.saveChannel('channel2', 'guild1', 'user2');
      });

      transaction();

      const channels = databaseService.getChannelsByGuild('guild1');
      assert.strictEqual(channels.length, 2);
    });
  });
});
