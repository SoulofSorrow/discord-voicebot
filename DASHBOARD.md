# TempVoice Dashboard 📊

## Overview

The TempVoice Dashboard provides a real-time web interface for monitoring and analyzing your Discord bot's performance, usage, and health.

![Dashboard Preview](https://via.placeholder.com/800x400?text=TempVoice+Dashboard)

## Features

### 📈 Real-Time Monitoring
- **WebSocket Updates**: Live data updates every 5 seconds
- **Active Channels**: Current number of active temporary voice channels
- **System Health**: Bot status, database connection, cache status
- **Performance Metrics**: Uptime, memory usage, cache hit rate

### 📊 Analytics & Insights
- **Channel Statistics**: Total created, active channels, top creators
- **User Analytics**: Most active users, channel creation patterns
- **Interaction Metrics**: Track button clicks, modal submissions
- **Activity Timeline**: Visual timeline of channel creation/deletion
- **Error Tracking**: Monitor errors by context and frequency

### 📉 Charts & Visualizations
- **Activity Timeline Chart**: Line chart showing channel creation and deletion over time
- **Interaction Distribution**: Pie chart of interactions by type
- **Top Creators Table**: Leaderboard of most active channel creators
- **Error Summary**: Recent errors and their frequency

### 🎯 API Endpoints

#### Dashboard Data
```
GET /api/dashboard?timeRange=86400000
```
Returns comprehensive dashboard data including channels, users, interactions, performance, and errors.

#### Channel Statistics
```
GET /api/channels?guildId=<id>&timeRange=<ms>
```
Returns channel statistics for a specific guild or all guilds.

#### User Statistics
```
GET /api/users?userId=<id>
```
Returns user-specific or global user statistics.

#### Performance Metrics
```
GET /api/performance
```
Returns current performance metrics including uptime, memory, cache, and rate limits.

#### Activity Timeline
```
GET /api/timeline?timeRange=<ms>&interval=<ms>
```
Returns time-bucketed activity data for charting.

#### Error Statistics
```
GET /api/errors?timeRange=<ms>
```
Returns error statistics grouped by context.

#### System Health
```
GET /api/health
```
Returns current system health status.

#### Export Report
```
GET /api/export?timeRange=<ms>
```
Downloads a JSON report with all analytics data.

## Getting Started

### 1. Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Dashboard Configuration
ENABLE_DASHBOARD=true          # Enable/disable dashboard (default: true)
DASHBOARD_PORT=3000            # Dashboard port (default: 3000)
```

### 2. Start the Bot

```bash
# Development mode
npm run dev

# Production mode
npm start

# Docker
docker compose up -d
```

### 3. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

For Docker deployments, use your server's IP:
```
http://your-server-ip:3000
```

## Docker Deployment

### Using Docker Compose

The dashboard is automatically included in the Docker setup:

```yaml
services:
  bot:
    ports:
      - "3000:3000"  # Dashboard
      - "9090:9090"  # Metrics
```

Start with:
```bash
docker compose up -d
```

### Port Configuration

By default, the dashboard uses:
- **Port 3000**: Web Dashboard
- **Port 9090**: Prometheus Metrics

You can change these in your `.env` file:
```bash
DASHBOARD_PORT=8080
METRICS_PORT=9091
```

Or override in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Host:Container
  - "9091:9090"
```

### Health Checks

Docker health check uses the metrics endpoint:
```bash
wget --no-verbose --tries=1 --spider http://localhost:9090/health
```

## Dashboard Features

### Stats Overview

The dashboard displays 8 key metrics:

| Metric | Description |
|--------|-------------|
| 🎯 Active Channels | Current number of active temporary channels |
| 📊 Total Created | Total channels created (lifetime) |
| 👥 Top Creator | User with most channels created |
| ⚡ Interactions | Total user interactions |
| 💾 Cache Hit Rate | Percentage of successful cache lookups |
| 🚦 Rate Limits | Active rate limit entries |
| ⏱️ Uptime | Bot uptime (days, hours, minutes) |
| 💾 Memory Usage | Current memory usage (MB) |

### Activity Timeline Chart

Line chart showing:
- **Green Line**: Channels created
- **Red Line**: Channels deleted

Time range selector:
- Last Hour
- Last 24 Hours (default)
- Last 7 Days
- Last 30 Days

### Interaction Distribution Chart

Pie chart showing interaction distribution by type:
- Name changes
- User limit adjustments
- Privacy changes
- Bitrate changes
- User management (trust, block, kick)
- Ownership transfers
- Channel deletions

### Top Channel Creators

Leaderboard showing:
- Rank
- User ID (truncated)
- Number of channels created

### Recent Errors

Table showing:
- Error context
- Error count
- Grouped by error type

### System Health

Real-time status indicators:
- **Bot Status**: Ready / Not Ready
- **Database**: Connected / Disconnected
- **Cache Size**: Number of cached entries
- **WebSocket**: Connected / Disconnected

## WebSocket Integration

### Real-Time Updates

The dashboard uses WebSockets for live updates:

```javascript
// Connection established
ws://localhost:3000

// Update frequency
Every 5 seconds

// Data types
- init: Initial data load
- update: Real-time updates
```

### Connection Status

The status indicator shows:
- 🟢 **Connected**: Receiving live updates
- 🟡 **Connecting**: Attempting to connect
- 🔴 **Disconnected**: No connection (auto-reconnect every 5s)

## Export Reports

### JSON Export

Click the "📥 Export Report" button to download a JSON report containing:

```json
{
  "generated": "2025-11-02T10:30:00.000Z",
  "timeRange": {
    "duration": 604800000,
    "from": "2025-10-26T10:30:00.000Z",
    "to": "2025-11-02T10:30:00.000Z"
  },
  "data": {
    "channels": { ... },
    "users": { ... },
    "interactions": { ... },
    "performance": { ... },
    "errors": { ... }
  },
  "timeline": [ ... ]
}
```

### Report Time Ranges

Reports can be exported for:
- Last Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days

## Customization

### Theme

The dashboard uses a dark theme matching Discord's color scheme:

```css
--bg-primary: #0d1117
--bg-secondary: #161b22
--bg-tertiary: #21262d
--text-primary: #c9d1d9
--accent-blue: #58a6ff
--accent-green: #3fb950
```

### Refresh Rate

To change the WebSocket update frequency, edit `DashboardService.js`:

```javascript
// Default: 5000ms (5 seconds)
setInterval(() => {
  // Broadcast updates
}, 5000);
```

## Security

### Network Access

**⚠️ Important**: The dashboard has no authentication by default.

For production deployments:

1. **Use a reverse proxy** (Nginx, Caddy) with authentication:
```nginx
location / {
    auth_basic "TempVoice Dashboard";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3000;
}
```

2. **Firewall rules**: Restrict access to trusted IPs only

3. **VPN**: Host dashboard on VPN-only network

4. **SSH Tunnel**: Access via SSH tunnel:
```bash
ssh -L 3000:localhost:3000 user@server
```

## Troubleshooting

### Dashboard Not Loading

**Check if dashboard is enabled:**
```bash
# In .env file
ENABLE_DASHBOARD=true
```

**Check if port is exposed:**
```bash
docker compose ps
# Should show: 0.0.0.0:3000->3000/tcp
```

**Check logs:**
```bash
docker compose logs -f bot
# Look for: "📊 Dashboard server listening on port 3000"
```

### WebSocket Not Connecting

**Check browser console:**
```javascript
// Should see
WebSocket connected
```

**Common issues:**
- **Reverse proxy**: Configure WebSocket support
- **Firewall**: Allow WebSocket connections
- **HTTPS**: Use `wss://` instead of `ws://`

### Data Not Updating

**Check database:**
```bash
# Should exist
ls -la data/tempvoice.db
```

**Check permissions:**
```bash
# Database should be writable
ls -l data/
```

**Restart bot:**
```bash
docker compose restart bot
```

### Charts Not Rendering

**Check Chart.js:**
- Ensure Chart.js CDN is accessible
- Check browser console for errors

**Clear browser cache:**
```bash
Ctrl+Shift+R (hard refresh)
```

## Performance

### Resource Usage

Typical dashboard resource usage:
- **Memory**: +5-10 MB
- **CPU**: Negligible (<1%)
- **Network**: ~1 KB/s per connected client

### Scaling

For high-traffic deployments:

1. **Increase WebSocket limit:**
```javascript
// In DashboardService.js
this.wss.maxClients = 100;
```

2. **Use CDN for static assets:**
```html
<!-- Serve from CDN -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css">
```

3. **Enable compression:**
```javascript
app.use(compression());
```

## Integration

### Prometheus

The dashboard exposes Prometheus metrics on port 9090:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'tempvoice'
    static_configs:
      - targets: ['localhost:9090']
```

### Grafana

Import the dashboard metrics into Grafana:

1. Add Prometheus as data source
2. Create dashboard with queries:
   - `tempvoice_channels_created_total`
   - `tempvoice_active_channels`
   - `tempvoice_errors_total`

## API Integration

### Example: Fetch Dashboard Data

```javascript
// Fetch dashboard data
const response = await fetch('http://localhost:3000/api/dashboard?timeRange=86400000');
const data = await response.json();

console.log('Active channels:', data.channels.active);
console.log('Total interactions:', data.interactions.total);
```

### Example: Export Report

```bash
curl -o report.json "http://localhost:3000/api/export?timeRange=604800000"
```

### Example: Health Check

```bash
curl http://localhost:3000/api/health
```

## Support

For issues or questions:
- 📚 [Main README](./README.md)
- 📋 [Features Documentation](./FEATURES.md)
- 🐛 [GitHub Issues](https://github.com/SoulofSorrow/discord-voicebot/issues)
