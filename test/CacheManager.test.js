import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CacheManager } from '../src/utils/CacheManager.js';

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager();
    cache.cache.clear();
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value');
      assert.strictEqual(cache.get('test-key'), 'test-value');
    });

    it('should return null for non-existent keys', () => {
      assert.strictEqual(cache.get('non-existent'), null);
    });

    it('should handle different data types', () => {
      cache.set('string', 'value');
      cache.set('number', 42);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);

      assert.strictEqual(cache.get('string'), 'value');
      assert.strictEqual(cache.get('number'), 42);
      assert.deepStrictEqual(cache.get('object'), { foo: 'bar' });
      assert.deepStrictEqual(cache.get('array'), [1, 2, 3]);
    });

    it('should overwrite existing values', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      assert.strictEqual(cache.get('key'), 'value2');
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key', 'value');
      assert.strictEqual(cache.has('key'), true);
    });

    it('should return false for non-existent keys', () => {
      assert.strictEqual(cache.has('non-existent'), false);
    });
  });

  describe('delete', () => {
    it('should remove values', () => {
      cache.set('key', 'value');
      cache.delete('key');
      assert.strictEqual(cache.has('key'), false);
    });

    it('should handle deleting non-existent keys', () => {
      assert.doesNotThrow(() => cache.delete('non-existent'));
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      assert.strictEqual(cache.has('key1'), false);
      assert.strictEqual(cache.has('key2'), false);
      assert.strictEqual(cache.has('key3'), false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      // Create a cache with short TTL for testing
      const shortTtlCache = new CacheManager(100); // 100ms TTL

      shortTtlCache.set('key1', 'value1');
      assert.strictEqual(shortTtlCache.get('key1'), 'value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      shortTtlCache.cleanup();
      assert.strictEqual(shortTtlCache.get('key1'), null);
    });

    it('should keep non-expired entries', async () => {
      cache.set('key1', 'value1');

      // Wait a bit but not long enough to expire
      await new Promise(resolve => setTimeout(resolve, 50));

      cache.cleanup();
      assert.strictEqual(cache.get('key1'), 'value1');
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      assert.strictEqual(cache.size(), 0);

      cache.set('key1', 'value1');
      assert.strictEqual(cache.size(), 1);

      cache.set('key2', 'value2');
      assert.strictEqual(cache.size(), 2);

      cache.delete('key1');
      assert.strictEqual(cache.size(), 1);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', () => {
      cache.set('key', 'cached-value');
      const result = cache.getOrSet('key', () => 'new-value');
      assert.strictEqual(result, 'cached-value');
    });

    it('should compute and cache value if not exists', () => {
      const result = cache.getOrSet('key', () => 'computed-value');
      assert.strictEqual(result, 'computed-value');
      assert.strictEqual(cache.get('key'), 'computed-value');
    });

    it('should handle async factory functions', async () => {
      const asyncFactory = async () => {
        return new Promise(resolve => setTimeout(() => resolve('async-value'), 10));
      };

      const result = await cache.getOrSet('key', asyncFactory);
      assert.strictEqual(result, 'async-value');
    });
  });
});
