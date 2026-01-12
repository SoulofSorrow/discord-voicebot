class MetricsCollector {
  constructor() {
    this.stats = {
      channelsCreated: 0,
      channelsDeleted: 0,
      interactions: new Map(),
      errors: new Map(),
      startTime: Date.now()
    };
    
    // Speichere Metriken alle 5 Minuten
    setInterval(() => this.saveMetrics(), 5 * 60 * 1000);
  }
  
  increment(metric, value = 1) {
    if (typeof this.stats[metric] === 'number') {
      this.stats[metric] += value;
    }
  }
  
  recordInteraction(type) {
    const count = this.stats.interactions.get(type) || 0;
    this.stats.interactions.set(type, count + 1);
  }
  
  recordError(type) {
    const count = this.stats.errors.get(type) || 0;
    this.stats.errors.set(type, count + 1);
  }
  
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      memoryUsage: process.memoryUsage()
    };
  }
  
  saveMetrics() {
    // Implementierung für Persistierung (z.B. in Datei oder DB)
    console.log('[Metrics]', JSON.stringify(this.getStats(), null, 2));
  }
}

export const metrics = new MetricsCollector();
