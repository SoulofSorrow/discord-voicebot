import http from 'http';
import { register, Counter, Gauge, Histogram } from 'prom-client';
import { logStartup } from '../utils/logger.js';
import databaseService from './DatabaseService.js';

class MonitoringService {
  constructor() {
    this.server = null;
    this.port = process.env.METRICS_PORT || 9090;

    // Prometheus metrics
    this.metrics = {
      channelsCreated: new Counter({
        name: 'tempvoice_channels_created_total',
        help: 'Total number of temporary voice channels created',
      }),
      channelsDeleted: new Counter({
        name: 'tempvoice_channels_deleted_total',
        help: 'Total number of temporary voice channels deleted',
      }),
      activeChannels: new Gauge({
        name: 'tempvoice_active_channels',
        help: 'Current number of active temporary voice channels',
      }),
      interactions: new Counter({
        name: 'tempvoice_interactions_total',
        help: 'Total number of Discord interactions',
        labelNames: ['type'],
      }),
      errors: new Counter({
        name: 'tempvoice_errors_total',
        help: 'Total number of errors',
        labelNames: ['context'],
      }),
      interactionDuration: new Histogram({
        name: 'tempvoice_interaction_duration_seconds',
        help: 'Duration of interactions in seconds',
        labelNames: ['type'],
        buckets: [0.1, 0.5, 1, 2, 5],
      }),
      dbOperations: new Counter({
        name: 'tempvoice_db_operations_total',
        help: 'Total number of database operations',
        labelNames: ['operation'],
      }),
      cacheHits: new Counter({
        name: 'tempvoice_cache_hits_total',
        help: 'Total number of cache hits',
      }),
      cacheMisses: new Counter({
        name: 'tempvoice_cache_misses_total',
        help: 'Total number of cache misses',
      }),
      botUptime: new Gauge({
        name: 'tempvoice_bot_uptime_seconds',
        help: 'Bot uptime in seconds',
      }),
    };

    this.startTime = Date.now();
  }

  /**
   * Start the HTTP server for metrics and health checks
   */
  start(client) {
    this.client = client;

    this.server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname === '/metrics') {
        this.handleMetrics(req, res);
      } else if (url.pathname === '/health') {
        this.handleHealth(req, res);
      } else if (url.pathname === '/ready') {
        this.handleReady(req, res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.server.listen(this.port, () => {
      logStartup(`📊 Monitoring server listening on port ${this.port}`);
      logStartup(`   - Metrics: http://localhost:${this.port}/metrics`);
      logStartup(`   - Health: http://localhost:${this.port}/health`);
      logStartup(`   - Ready: http://localhost:${this.port}/ready`);
    });

    // Update uptime metric every 10 seconds
    this.uptimeInterval = setInterval(() => {
      const uptime = (Date.now() - this.startTime) / 1000;
      this.metrics.botUptime.set(uptime);
    }, 10000);
  }

  /**
   * Handle /metrics endpoint - Prometheus format
   */
  async handleMetrics(req, res) {
    try {
      // Update active channels gauge
      if (this.client?.tempVoiceOwners) {
        this.metrics.activeChannels.set(this.client.tempVoiceOwners.size);
      }

      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.writeHead(500);
      res.end('Error generating metrics');
      console.error('Metrics error:', error);
    }
  }

  /**
   * Handle /health endpoint - Liveness probe
   */
  handleHealth(req, res) {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.startTime) / 1000,
      version: '2.0.0',
    };

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(health));
  }

  /**
   * Handle /ready endpoint - Readiness probe
   */
  handleReady(req, res) {
    const isReady = this.checkReadiness();

    const ready = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks: {
        bot: this.client?.isReady() || false,
        database: databaseService.initialized || false,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(isReady ? 200 : 503);
    res.end(JSON.stringify(ready));
  }

  /**
   * Check if the bot is ready to serve traffic
   */
  checkReadiness() {
    return (
      this.client?.isReady() === true &&
      databaseService.initialized === true
    );
  }

  /**
   * Record channel creation
   */
  recordChannelCreated() {
    this.metrics.channelsCreated.inc();
  }

  /**
   * Record channel deletion
   */
  recordChannelDeleted() {
    this.metrics.channelsDeleted.inc();
  }

  /**
   * Record interaction
   */
  recordInteraction(type) {
    this.metrics.interactions.inc({ type });
  }

  /**
   * Record error
   */
  recordError(context) {
    this.metrics.errors.inc({ context });
  }

  /**
   * Record interaction duration
   */
  recordInteractionDuration(type, durationSeconds) {
    this.metrics.interactionDuration.observe({ type }, durationSeconds);
  }

  /**
   * Record database operation
   */
  recordDbOperation(operation) {
    this.metrics.dbOperations.inc({ operation });
  }

  /**
   * Record cache hit
   */
  recordCacheHit() {
    this.metrics.cacheHits.inc();
  }

  /**
   * Record cache miss
   */
  recordCacheMiss() {
    this.metrics.cacheMisses.inc();
  }

  /**
   * Stop the monitoring server
   */
  stop() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }

    if (this.server) {
      this.server.close(() => {
        logStartup('📊 Monitoring server stopped');
      });
    }
  }
}

// Export singleton instance
const monitoringService = new MonitoringService();
export default monitoringService;
