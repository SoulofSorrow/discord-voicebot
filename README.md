# Discord TempVoice Bot

<p align="center">
  <img src="img/bot_avatar.png" width="250" height="250" alt="TempVoice Bot" />
</p>

<p align="center">
  <strong>A powerful, user-friendly Discord bot for dynamic temporary voice channels</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Discord.js-14.x-blue?logo=discord" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
  <img src="https://img.shields.io/badge/Version-2.0.0-red" />
  <img src="https://img.shields.io/badge/Languages-6-purple" />
</p>

## 🚀 Overview

TempVoice transforms Discord voice channel management by giving users instant control over their own temporary voice rooms. No commands to memorize, no complex setup—just intuitive button-based controls that make voice channel management effortless.

![Bot Demo](img/bot_example.gif)

### ✨ Key Features

- **🎯 One-Click Channel Creation**: Join a designated channel to instantly get your own private room
- **🔧 Intuitive Dashboard**: Manage everything through interactive buttons—no commands needed
- **🌍 Multi-Language Support**: Available in English, German, Indonesian, Russian, Japanese, and Chinese
- **🛡️ Advanced Privacy Controls**: Lock, hide, or control chat access with granular permissions
- **👥 User Management**: Trust, block, kick, and transfer ownership seamlessly
- **⚙️ Customization Options**: Adjust bitrate, region, user limits, and channel names
- **📊 Built-in Monitoring**: Comprehensive logging and metrics collection
- **💾 Persistent Storage**: SQLite database for reliable data persistence
- **🔍 Observability**: Prometheus metrics export and Sentry error tracking
- **🏥 Health Checks**: Kubernetes-ready liveness and readiness probes
- **🐳 Docker Ready**: Easy deployment with Docker Compose
- **⚡ Production Grade**: Rate limiting, error handling, and performance optimization

## 🆕 What's New in v2.0

### Database Persistence
All channel ownership data and user permissions are now persisted to SQLite database:
- **Automatic Recovery**: Channel ownership survives bot restarts
- **Trust/Block Lists**: User permissions stored persistently
- **Metrics History**: Historical data for analytics

### Monitoring & Observability
Production-grade monitoring with multiple integrations:
- **Prometheus Metrics**: Export metrics on `:9090/metrics`
  - Active channels, creation/deletion counts
  - Error rates, interaction latency
  - Cache hit/miss rates
- **Sentry Integration**: Real-time error tracking with context
- **Health Checks**: `/health` (liveness) and `/ready` (readiness) endpoints

### Testing Infrastructure
Comprehensive test coverage for critical components:
- **Unit Tests**: ValidationService, Sanitizer, CacheManager
- **Database Tests**: Full DatabaseService test coverage
- **Native Node.js**: Using built-in `node:test` framework

## 🏗️ Architecture

```
TempVoice/
├── 🔧 config/              # Configuration management
├── 🌐 language/            # Multi-language support
├── 🎯 src/
│   ├── 🏗️ core/            # Bot initialization & setup
│   ├── 📡 events/          # Discord event handlers
│   ├── 🎭 modals/          # Interactive modal handlers
│   ├── 🔄 handlers/        # Embed & interaction controllers
│   ├── 🛠️ services/        # Voice channel business logic
│   └── 🧰 utils/           # Utilities & helpers
├── 🐳 docker-compose.yml   # Container orchestration
├── 📋 package.json         # Dependencies & scripts
└── ⚙️ env.example          # Environment template
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Discord Bot Token** with appropriate permissions

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/SoulofSorrow/discord-tempvoice.git
cd discord-tempvoice

# Install dependencies
npm install
```

### 2. Configuration

```bash
# Copy environment template
cp env.example .env
```

Edit `.env` with your Discord bot configuration:

```env
# Discord Bot Configuration (REQUIRED)
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_discord_server_id
CATEGORY_CHANNEL_ID=category_for_temp_channels
EMBED_CHANNEL_ID=channel_for_dashboard
VOICE_CHANNEL_ID=channel_users_join_to_create
LOG_CHANNEL_ID=channel_for_logging

# Bot Settings (OPTIONAL)
BANNER_URL=https://your-custom-banner-url.png
USE_UNICODE_EMOJI=true
BOT_LANGUAGE=en
ENABLE_LOGGING=true

# Performance & Security (OPTIONAL)
MAX_TEMP_CHANNELS=50
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10

# Monitoring (OPTIONAL)
SENTRY_DSN=your_sentry_dsn_here
METRICS_PORT=9090
NODE_ENV=production
```

### 3. Discord Setup

1. **Create Bot**: Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. **Set Permissions**: Grant these bot permissions:
   - Manage Channels
   - Manage Roles
   - Connect
   - Move Members
   - Mute Members
   - Deafen Members
   - Send Messages
   - Embed Links
   - Use External Emojis

3. **Server Setup**:
   - Create a category for temporary channels
   - Create a text channel for the dashboard
   - Create a voice channel users join to create temp rooms
   - (Optional) Create a logging channel

### 4. Launch

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test
```

### 5. Monitoring Endpoints

Once the bot is running, you can access:

- **Prometheus Metrics**: `http://localhost:9090/metrics`
  - Channel creation/deletion rates
  - Active channel count
  - Error counts and types
  - Interaction latencies

- **Health Check**: `http://localhost:9090/health`
  - Bot uptime and version
  - Always returns 200 OK if server is running

- **Readiness Check**: `http://localhost:9090/ready`
  - Bot status (ready/not ready)
  - Database initialization status
  - Used by Kubernetes for traffic routing
```

## 🐳 Docker Deployment

For production environments, use Docker Compose:

```bash
# Copy environment file
cp env.example .env
# Edit .env with your configuration

# Start the container
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

## 🎮 User Guide

### Creating a Voice Room

1. Join the designated voice channel (configured in `VOICE_CHANNEL_ID`)
2. You'll be automatically moved to your new private room
3. Use the dashboard buttons to customize your room

### Dashboard Controls

| Button | Function |
|--------|----------|
| 📝 **Name** | Change your channel name |
| 🔢 **Limit** | Set user limit (0-99) |
| 🔒 **Privacy** | Lock/unlock, hide/show, control chat |
| 🔕 **DND** | Toggle "Do Not Disturb" mode |
| 🌐 **Region** | Change voice server region |
| ✅ **Trust** | Give users special access |
| 🚫 **Untrust** | Remove trusted status |
| ⛔ **Block** | Block users from your channel |
| ⭕ **Unblock** | Unblock previously blocked users |
| 🎚️ **Bitrate** | Adjust audio quality |
| 📨 **Invite** | Send direct invitations |
| 👢 **Kick** | Remove users from channel |
| 🙋 **Claim** | Take ownership if owner left |
| 🔄 **Transfer** | Give ownership to another user |
| 🗑️ **Delete** | Delete your temporary channel |

## 🌍 Multi-Language Support

TempVoice supports 6 languages out of the box:

- 🇺🇸 **English** (en)
- 🇩🇪 **German** (de)
- 🇮🇩 **Indonesian** (id)
- 🇷🇺 **Russian** (ru)
- 🇯🇵 **Japanese** (jp)
- 🇨🇳 **Chinese** (cn)

Change language by setting `BOT_LANGUAGE` in your `.env` file.

## ⚙️ Advanced Configuration

### Performance Tuning

```env
# Increase for larger servers
MAX_TEMP_CHANNELS=100

# Rate limiting (requests per window)
RATE_LIMIT_MAX_REQUESTS=15
RATE_LIMIT_WINDOW=60000

# Memory optimization
DEBUG_MODE=false
LOG_LEVEL=info
```

### Monitoring Integration

```env
# Error tracking
SENTRY_DSN=your_sentry_dsn

# Metrics endpoint
METRICS_ENDPOINT=http://your-metrics-server

# Error webhooks
ERROR_WEBHOOK_URL=your_webhook_url
```

### Custom Styling

```env
# Custom dashboard banner
BANNER_URL=https://your-domain.com/banner.png

# Embed color (hex)
EMBED_COLOR=#7289da

# Bot branding
BOT_LABEL=YourBotName
```

## 🧪 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Linting
npm run lint
npm run lint:fix

# Security audit
npm run security

# Dependency management
npm run deps:check
npm run deps:update

# Docker development
npm run docker:build
npm run docker:run
```

### Code Structure

- **Modular Design**: Clean separation between events, modals, and utilities
- **Error Handling**: Comprehensive error catching and logging
- **Rate Limiting**: Built-in protection against spam and abuse
- **Caching**: Intelligent caching for better performance
- **Validation**: Input sanitization and validation throughout
- **Metrics**: Performance monitoring and usage statistics

## 🔒 Security Features

- **Input Sanitization**: All user inputs are validated and sanitized
- **Permission Validation**: Strict ownership and permission checks
- **Rate Limiting**: Configurable limits to prevent abuse
- **Error Handling**: Graceful error handling without exposing internals
- **Audit Logging**: Comprehensive logging of all actions

## 📊 Monitoring & Logging

TempVoice includes built-in monitoring capabilities:

- **Action Logging**: All channel operations are logged
- **Performance Metrics**: Track channel creation/deletion rates
- **Error Tracking**: Comprehensive error logging and reporting
- **Health Checks**: Docker health checks for container monitoring

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper tests
4. Follow the existing code style
5. Submit a pull request with a clear description

### Development Guidelines

- Use ES6+ features and modern JavaScript
- Follow the existing file structure and naming conventions
- Add JSDoc comments for new functions
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Discord.js community for excellent documentation
- All contributors who helped improve this project
- Users who provided feedback and feature requests

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/SoulofSorrow/discord-tempvoice/issues)
- **Documentation**: Check this README and inline code comments
- **Community**: Join our Discord server for community support

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/SoulofSorrow">SoulofSorrow</a>
</p>
