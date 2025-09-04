class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.globalLimits = new Map();
    
    // Cleanup alte Einträge
    setInterval(() => this.cleanup(), 60000);
  }
  
  checkLimit(userId, action, maxAttempts = 5, window = 60000) {
    const key = `${userId}_${action}`;
    const now = Date.now();
    
    if (!this.limits.has(key)) {
      this.limits.set(key, { count: 1, resetTime: now + window });
      return { allowed: true, remaining: maxAttempts - 1 };
    }
    
    const limit = this.limits.get(key);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + window;
      return { allowed: true, remaining: maxAttempts - 1 };
    }
    
    if (limit.count >= maxAttempts) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetIn: limit.resetTime - now 
      };
    }
    
    limit.count++;
    return { allowed: true, remaining: maxAttempts - limit.count };
  }
  
  checkGlobalLimit(action, maxAttempts = 100, window = 60000) {
    return this.checkLimit('global', action, maxAttempts, window);
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();
