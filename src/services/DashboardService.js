import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AnalyticsService from './AnalyticsService.js';
import AdminService from './AdminService.js';
import monitoringService from './MonitoringService.js';
import databaseService from './DatabaseService.js';
import { rateLimiter } from '../utils/RateLimiter.js';
import { cache } from '../utils/CacheManager.js';
import { logger } from '../utils/StructuredLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dashboard service providing web interface and API
 */
export class DashboardService {
  constructor() {
    this.app = null;
    this.server = null;
    this.wss = null;
    this.port = process.env.DASHBOARD_PORT || 3000;
    this.client = null;
  }

  /**
   * Initialize and start dashboard server
   * @param {Client} client - Discord client
   */
  start(client) {
    this.client = client;

    // Create Express app
    this.app = express();

    // Middleware
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(join(__dirname, '../../public')));

    // Setup routes
    this.setupRoutes();

    // Start HTTP server
    this.server = this.app.listen(this.port, () => {
      logger.info(`📊 Dashboard server listening on port ${this.port}`, {
        url: `http://localhost:${this.port}`,
      });
    });

    // Setup WebSocket for real-time updates
    this.setupWebSocket();

    // Start broadcasting updates
    this.startBroadcasting();
  }

  /**
   * Create rate limiting middleware for dashboard routes
   */
  createRateLimitMiddleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const identifier = `dashboard:${ip}`;

      // Allow 30 requests per minute per IP
      if (!rateLimiter.checkLimit(identifier, 'dashboard_access', 30, 60000)) {
        logger.warn('Dashboard rate limit exceeded', { ip, path: req.path });
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        });
      }

      next();
    };
  }

  /**
   * Setup HTTP routes
   */
  setupRoutes() {
    // Create rate limiting middleware
    const rateLimitMiddleware = this.createRateLimitMiddleware();

    // Apply rate limiting to all routes
    this.app.use(rateLimitMiddleware);

    // Main dashboard page
    this.app.get('/', rateLimitMiddleware, (req, res) => {
      res.sendFile(join(__dirname, '../../public/dashboard.html'));
    });

    // API: Dashboard overview
    this.app.get('/api/dashboard', rateLimitMiddleware, (req, res) => {
      try {
        const timeRange = parseInt(req.query.timeRange) || 24 * 60 * 60 * 1000;
        const data = AnalyticsService.getDashboardData(this.client, { timeRange });
        res.json(data);
      } catch (error) {
        logger.error('Dashboard API error', { error });
        res.status(500).json({ error: error.message });
      }
    });

    // API: Channel statistics
    this.app.get('/api/channels', rateLimitMiddleware, (req, res) => {
      try {
        const stats = AnalyticsService.getChannelStats(this.client, req.query);
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: User statistics
    this.app.get('/api/users', rateLimitMiddleware, (req, res) => {
      try {
        const userId = req.query.userId;
        const stats = AnalyticsService.getUserStats(userId);
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Performance metrics
    this.app.get('/api/performance', rateLimitMiddleware, (req, res) => {
      try {
        const metrics = AnalyticsService.getPerformanceMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Activity timeline
    this.app.get('/api/timeline', rateLimitMiddleware, (req, res) => {
      try {
        const timeRange = parseInt(req.query.timeRange) || 24 * 60 * 60 * 1000;
        const interval = parseInt(req.query.interval) || 60 * 60 * 1000;
        const timeline = AnalyticsService.getActivityTimeline({ timeRange, interval });
        res.json(timeline);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Error statistics
    this.app.get('/api/errors', rateLimitMiddleware, (req, res) => {
      try {
        const timeRange = parseInt(req.query.timeRange) || 24 * 60 * 60 * 1000;
        const stats = AnalyticsService.getErrorStats({ timeRange });
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: System health
    this.app.get('/api/health', rateLimitMiddleware, (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bot: {
          ready: this.client?.isReady() || false,
          channels: this.client?.tempVoiceOwners?.size || 0,
        },
        database: {
          initialized: databaseService.initialized,
        },
        cache: {
          size: cache.cache.size,
        },
        rateLimits: rateLimiter.getStats(),
      };
      res.json(health);
    });

    // API: Export report
    this.app.get('/api/export', rateLimitMiddleware, (req, res) => {
      try {
        const timeRange = parseInt(req.query.timeRange) || 7 * 24 * 60 * 60 * 1000;
        const report = AnalyticsService.exportReport(this.client, { timeRange });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=tempvoice-report.json');
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Setup WebSocket server for real-time updates
   */
  setupWebSocket() {
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const ip = req.socket.remoteAddress || 'unknown';
      const identifier = `dashboard:ws:${ip}`;

      // Rate limit WebSocket connections (max 5 per minute per IP)
      if (!rateLimiter.checkLimit(identifier, 'ws_connection', 5, 60000)) {
        logger.warn('WebSocket rate limit exceeded', { ip });
        ws.close(1008, 'Rate limit exceeded');
        return;
      }

      logger.info('Dashboard WebSocket client connected', { ip });

      // Send initial data
      ws.send(JSON.stringify({
        type: 'init',
        data: AnalyticsService.getDashboardData(this.client, {
          timeRange: 24 * 60 * 60 * 1000,
        }),
      }));

      ws.on('close', () => {
        logger.info('Dashboard WebSocket client disconnected', { ip });
      });

      ws.on('error', (error) => {
        logger.error('Dashboard WebSocket error', { error, ip });
      });
    });
  }

  /**
   * Start broadcasting updates to WebSocket clients
   */
  startBroadcasting() {
    // Broadcast updates every 5 seconds
    setInterval(() => {
      if (!this.wss) return;

      const update = {
        type: 'update',
        timestamp: Date.now(),
        data: {
          channels: AnalyticsService.getChannelStats(this.client),
          performance: AnalyticsService.getPerformanceMetrics(),
          health: {
            bot: this.client?.isReady() || false,
            database: databaseService.initialized,
            uptime: process.uptime(),
          },
        },
      };

      // Broadcast to all connected clients
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify(update));
        }
      });
    }, 5000);
  }

  /**
   * Stop dashboard server
   */
  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close(() => {
        logger.info('📊 Dashboard server stopped');
      });
    }
  }
}

// Export singleton instance
const dashboardService = new DashboardService();
export default dashboardService;
