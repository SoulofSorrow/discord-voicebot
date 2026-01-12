/**
 * LRU (Least Recently Used) Cache Implementation
 * Optimized for Discord bot caching with TTL support
 */
export class LRUCache {
  /**
   * Create an LRU cache
   * @param {number} maxSize - Maximum number of items
   * @param {number} defaultTTL - Default TTL in milliseconds
   */
  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };

    // Periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const item = this.cache.get(key);
    const now = Date.now();

    // Check if expired
    if (now > item.expiry) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, {
      ...item,
      lastAccess: now
    });

    this.stats.hits++;
    return item.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in ms (optional)
   */
  set(key, value, ttl = null) {
    const now = Date.now();
    const expiry = now + (ttl || this.defaultTTL);

    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }

    // Add to end (most recently used)
    this.cache.set(key, {
      value,
      expiry,
      created: now,
      lastAccess: now
    });
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if exists
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const item = this.cache.get(key);
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear() {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get or compute value if not in cache
   * @param {string} key - Cache key
   * @param {Function} factory - Function to compute value
   * @param {number} ttl - TTL in ms (optional)
   * @returns {*} Cached or computed value
   */
  getOrSet(key, factory, ttl = null) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get or compute async value if not in cache
   * @param {string} key - Cache key
   * @param {Function} factory - Async function to compute value
   * @param {number} ttl - TTL in ms (optional)
   * @returns {Promise<*>} Cached or computed value
   */
  async getOrSetAsync(key, factory, ttl = null) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get multiple values at once
   * @param {string[]} keys - Array of keys
   * @returns {Map} Map of key to value
   */
  getMany(keys) {
    const result = new Map();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    return result;
  }

  /**
   * Set multiple values at once
   * @param {Map|Object} entries - Map or object of key-value pairs
   * @param {number} ttl - TTL in ms (optional)
   */
  setMany(entries, ttl = null) {
    const items = entries instanceof Map ? entries : Object.entries(entries);
    for (const [key, value] of items) {
      this.set(key, value, ttl);
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        this.stats.expirations++;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 LRU Cache: Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache size
   * @returns {number} Number of items
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      utilization: `${(this.cache.size / this.maxSize * 100).toFixed(1)}%`
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }

  /**
   * Get all keys in cache (oldest to newest)
   * @returns {string[]} Array of keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in cache
   * @returns {Array} Array of values
   */
  values() {
    const values = [];
    for (const item of this.cache.values()) {
      if (Date.now() <= item.expiry) {
        values.push(item.value);
      }
    }
    return values;
  }

  /**
   * Get entries with metadata
   * @returns {Array} Array of [key, metadata] pairs
   */
  entries() {
    const now = Date.now();
    const entries = [];

    for (const [key, item] of this.cache.entries()) {
      if (now <= item.expiry) {
        entries.push([key, {
          value: item.value,
          age: now - item.created,
          ttl: item.expiry - now,
          accessed: item.lastAccess
        }]);
      }
    }

    return entries;
  }

  /**
   * Peek at value without updating LRU position
   * @param {string} key - Cache key
   * @returns {*} Value or null
   */
  peek(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const item = this.cache.get(key);
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Update TTL for existing key
   * @param {string} key - Cache key
   * @param {number} ttl - New TTL in ms
   * @returns {boolean} True if updated
   */
  updateTTL(key, ttl) {
    if (!this.cache.has(key)) {
      return false;
    }

    const item = this.cache.get(key);
    item.expiry = Date.now() + ttl;
    return true;
  }

  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}
