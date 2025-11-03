/**
 * Enhanced rate limiter with multi-tier limiting
 * Supports user, channel, and global rate limits
 */
class RateLimiter {
  constructor() {
    this.userLimits = new Map();      // Per-user limits
    this.channelLimits = new Map();   // Per-channel limits
    this.globalLimits = new Map();    // Global limits
    this.violations = new Map();      // Track repeated violations

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check user-specific rate limit
   * @param {string} userId - Discord user ID
   * @param {string} action - Action type
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} window - Time window in ms
   * @returns {Object} Rate limit result
   */
  checkUserLimit(userId, action, maxAttempts = 10, window = 60000) {
    return this._checkLimit(this.userLimits, `user_${userId}_${action}`, maxAttempts, window, 'user');
  }

  /**
   * Alias for checkUserLimit for backwards compatibility
   * @param {string} userId - Discord user ID
   * @param {string} action - Action type
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} window - Time window in ms
   * @returns {Object} Rate limit result
   */
  checkLimit(userId, action, maxAttempts = 10, window = 60000) {
    return this.checkUserLimit(userId, action, maxAttempts, window);
  }

  /**
   * Check channel-specific rate limit
   * @param {string} channelId - Discord channel ID
   * @param {string} action - Action type
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} window - Time window in ms
   * @returns {Object} Rate limit result
   */
  checkChannelLimit(channelId, action, maxAttempts = 50, window = 60000) {
    return this._checkLimit(this.channelLimits, `channel_${channelId}_${action}`, maxAttempts, window, 'channel');
  }

  /**
   * Check global rate limit
   * @param {string} action - Action type
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} window - Time window in ms
   * @returns {Object} Rate limit result
   */
  checkGlobalLimit(action, maxAttempts = 200, window = 60000) {
    return this._checkLimit(this.globalLimits, `global_${action}`, maxAttempts, window, 'global');
  }

  /**
   * Check all limits for a request (user, channel, global)
   * @param {Object} params - Request parameters
   * @returns {Object} Combined rate limit result
   */
  checkAllLimits({ userId, channelId, action }) {
    // Check user limit (strictest)
    const userLimit = this.checkUserLimit(userId, action, 10, 60000);
    if (!userLimit.allowed) {
      this._recordViolation(userId, action);
      return { ...userLimit, limitType: 'user' };
    }

    // Check channel limit
    if (channelId) {
      const channelLimit = this.checkChannelLimit(channelId, action, 50, 60000);
      if (!channelLimit.allowed) {
        return { ...channelLimit, limitType: 'channel' };
      }
    }

    // Check global limit (most lenient)
    const globalLimit = this.checkGlobalLimit(action, 200, 60000);
    if (!globalLimit.allowed) {
      return { ...globalLimit, limitType: 'global' };
    }

    // All limits passed
    return {
      allowed: true,
      remaining: Math.min(userLimit.remaining, globalLimit.remaining),
      limitType: 'none'
    };
  }

  /**
   * Internal method to check rate limit
   * @private
   */
  _checkLimit(store, key, maxAttempts, window, type) {
    const now = Date.now();

    if (!store.has(key)) {
      store.set(key, {
        count: 1,
        resetTime: now + window,
        firstAttempt: now
      });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetIn: window
      };
    }

    const limit = store.get(key);

    // Reset if window expired
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + window;
      limit.firstAttempt = now;
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetIn: window
      };
    }

    // Check if limit exceeded
    if (limit.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: limit.resetTime - now,
        waitTime: this._formatWaitTime(limit.resetTime - now)
      };
    }

    // Increment counter
    limit.count++;
    return {
      allowed: true,
      remaining: maxAttempts - limit.count,
      resetIn: limit.resetTime - now
    };
  }

  /**
   * Record rate limit violation for adaptive limiting
   * @private
   */
  _recordViolation(userId, action) {
    const key = `violation_${userId}_${action}`;
    const now = Date.now();

    if (!this.violations.has(key)) {
      this.violations.set(key, { count: 1, lastViolation: now });
    } else {
      const violation = this.violations.get(key);
      violation.count++;
      violation.lastViolation = now;

      // Apply stricter limits for repeat offenders
      if (violation.count > 5) {
        // Temporarily reduce their rate limit
        const stricter = this._checkLimit(
          this.userLimits,
          `strict_${userId}_${action}`,
          3,  // Much stricter limit
          300000  // 5 minute window
        );
        return stricter;
      }
    }
  }

  /**
   * Reset rate limit for a specific user/action
   * @param {string} userId - Discord user ID
   * @param {string} action - Action type
   */
  resetUserLimit(userId, action) {
    this.userLimits.delete(`user_${userId}_${action}`);
  }

  /**
   * Reset all rate limits for a user
   * @param {string} userId - Discord user ID
   */
  resetAllUserLimits(userId) {
    for (const [key] of this.userLimits.entries()) {
      if (key.startsWith(`user_${userId}_`)) {
        this.userLimits.delete(key);
      }
    }
  }

  /**
   * Get current rate limit status
   * @param {string} userId - Discord user ID
   * @param {string} action - Action type
   * @returns {Object} Current status
   */
  getStatus(userId, action) {
    const key = `user_${userId}_${action}`;
    const limit = this.userLimits.get(key);

    if (!limit) {
      return { active: false };
    }

    const now = Date.now();
    return {
      active: true,
      count: limit.count,
      resetIn: limit.resetTime - now,
      resetTime: new Date(limit.resetTime).toISOString()
    };
  }

  /**
   * Format wait time in human-readable format
   * @private
   */
  _formatWaitTime(ms) {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Cleanup expired rate limit entries
   */
  cleanup() {
    const now = Date.now();
    const stores = [this.userLimits, this.channelLimits, this.globalLimits, this.violations];

    let cleaned = 0;
    for (const store of stores) {
      for (const [key, limit] of store.entries()) {
        if (now > limit.resetTime || now > limit.lastViolation + 3600000) {
          store.delete(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Get statistics about current rate limits
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      userLimits: this.userLimits.size,
      channelLimits: this.channelLimits.size,
      globalLimits: this.globalLimits.size,
      violations: this.violations.size,
      total: this.userLimits.size + this.channelLimits.size + this.globalLimits.size
    };
  }
}

export { RateLimiter };
export const rateLimiter = new RateLimiter();
