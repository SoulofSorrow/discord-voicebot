class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 Minuten

    // Cleanup interval - unref() allows Node to exit even if this timer is active
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Jede Minute
    this.cleanupInterval.unref();
  }
  
  set(key, value, customTTL = null) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTTL || this.ttl
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  async getGuildMember(guild, userId) {
    const cacheKey = `member_${guild.id}_${userId}`;
    let member = this.get(cacheKey);
    
    if (!member) {
      try {
        member = await guild.members.fetch(userId);
        if (member) this.set(cacheKey, member);
      } catch (error) {
        return null;
      }
    }
    
    return member;
  }
  
  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }

  getOrSet(key, factory) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = factory();
    this.set(key, value);
    return value;
  }
}

export { CacheManager };
export const cache = new CacheManager();
