# 🎮 Admin Slash Commands Guide

Complete guide for using the `/admin` slash commands in TempVoice v2.0.

---

## 🚀 Quick Start

### 1. Setup

Add your bot's Client ID to `.env`:

```env
# .env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_bot_client_id_here  # ← NEW! Get this from Discord Developer Portal
GUILD_ID=your_server_id_here
```

**Where to find Client ID:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Copy the **Application ID** (this is your CLIENT_ID)

### 2. Deploy Commands

Deploy the slash commands to your Discord server:

```bash
npm run deploy
```

Expected output:
```
📋 Loading commands...
   ✅ Loaded: admin

📦 Total commands loaded: 1

🚀 Started refreshing 1 application (/) commands.
✅ Successfully registered 1 application (/) commands.

📋 Registered commands:
   - /admin (ID: 1234567890)

🎉 Command deployment complete!
💡 Commands should appear in Discord within a few seconds.
```

### 3. Use Commands

In Discord, type `/admin` and you'll see all available subcommands!

---

## 👑 Who Can Use These Commands?

Users with **any** of these Discord permissions:
- ✅ **Administrator**
- ✅ **Manage Guild** (Server verwalten)
- ✅ **Manage Channels** (Kanäle verwalten)

**No configuration needed** - permissions are checked automatically!

---

## 📋 Available Commands

### 1️⃣ `/admin stats`

**Description:** Show system statistics

**Usage:**
```
/admin stats
```

**Output:**
```
📊 System Statistics

🤖 Bot
Uptime: 12h 34m
Memory: 45.23 MB
Node: v20.11.0

📺 Channels
Active: 15
Database: 15

💾 Cache
Entries: 142

⏱️ Rate Limits
User Limits: 45
Channel Limits: 12
Global Limits: 8
Violations: 3

🔍 Monitoring
Ready: ✅
Database: ✅
Cache: ✅
```

---

### 2️⃣ `/admin cleanup`

**Description:** Cleanup orphaned (empty) channels

**Usage:**
```
/admin cleanup
```

**What it does:**
- Scans all temp voice channels
- Finds channels with 0 members
- Deletes them automatically
- Cleans up database entries

**Output:**
```
🧹 Cleanup Complete

Deleted 3 orphaned channels.

Channel IDs: 123456789, 234567890, 345678901
```

---

### 3️⃣ `/admin clear-cache`

**Description:** Clear all caches

**Usage:**
```
/admin clear-cache
```

**What it does:**
- Clears LRU cache
- Frees memory
- Forces cache rebuild

**Output:**
```
🧹 Cache Cleared

Successfully cleared 142 cache entries.
```

**When to use:**
- Bot behavior seems incorrect
- After major updates
- Memory optimization

---

### 4️⃣ `/admin reload-config`

**Description:** Reload configuration without restart

**Usage:**
```
/admin reload-config
```

**What it does:**
- Reloads `config/config.js`
- Applies new settings immediately
- No bot restart required

**Output:**
```
🔄 Configuration Reloaded

New Configuration
Language: de
Logging: Enabled
Label: TempVoice
```

**Use case:**
- Changed language setting
- Updated bot label
- Modified config values

---

### 5️⃣ `/admin force-delete`

**Description:** Force delete a channel (bypasses owner check)

**Usage:**
```
/admin force-delete channel_id:123456789012345678
```

**Parameters:**
- `channel_id` **(required)**: The ID of the channel to delete

**What it does:**
- Deletes channel immediately
- Bypasses owner permissions
- Cleans up database
- Removes from tempVoiceOwners

**Output:**
```
🗑️ Channel Deleted

Channel: User's Private Room
Owner: @Username
Channel ID: 123456789012345678
```

**When to use:**
- Channel owner left server
- Stuck/broken channels
- Emergency cleanup

---

### 6️⃣ `/admin force-transfer`

**Description:** Force transfer channel ownership

**Usage:**
```
/admin force-transfer channel_id:123456789012345678 new_owner:@NewUser
```

**Parameters:**
- `channel_id` **(required)**: The channel ID
- `new_owner` **(required)**: The new owner (mention/select user)

**What it does:**
- Transfers ownership without consent
- Updates database
- Updates tempVoiceOwners map
- Logs the action

**Output:**
```
🔄 Ownership Transferred

Channel ID: 123456789012345678
Old Owner: @OldUser
New Owner: @NewUser

Ownership has been forcefully transferred.
```

**When to use:**
- Original owner left
- Owner abuse
- Dispute resolution

---

### 7️⃣ `/admin reset-ratelimit`

**Description:** Reset rate limits for a user

**Usage:**
```
/admin reset-ratelimit user:@Username
```

**Parameters:**
- `user` **(required)**: The user (mention/select)

**What it does:**
- Resets ALL rate limits for user
- Allows immediate usage
- Clears violations

**Output:**
```
⏱️ Rate Limit Reset

Successfully reset all rate limits for @Username.
```

**When to use:**
- False positive rate limit
- Testing
- Special circumstances

---

### 8️⃣ `/admin export-db`

**Description:** Export database to JSON file

**Usage:**
```
/admin export-db
```

**What it does:**
- Exports all channels
- Exports all permissions
- Exports last 1000 metrics
- Creates JSON file

**Output:**
```
💾 Database Export

Channels: 15
Permissions: 45
Metrics: 234

Backup file attached.
```

**Attached file:** `tempvoice-backup-2025-11-02.json`

**File structure:**
```json
{
  "timestamp": 1730579423000,
  "channels": [
    {
      "channel_id": "123456789",
      "guild_id": "987654321",
      "owner_id": "111222333",
      "created_at": 1730579400000,
      "settings": "{\"locked\":true}"
    }
  ],
  "permissions": [...],
  "metrics": [...]
}
```

**When to use:**
- Regular backups
- Before major updates
- Data analysis
- Migration

---

## 🎨 Command Features

### Ephemeral Responses
All commands respond with **ephemeral messages** (only visible to you) for privacy.

### Rich Embeds
All responses use Discord embeds with:
- ✅ Color-coded (blue, green, red)
- ✅ Structured information
- ✅ Timestamps
- ✅ User attribution

### Error Handling
- ✅ Clear error messages
- ✅ Detailed error context
- ✅ Suggestions for fixes

### Logging
All admin actions are logged with:
- Admin ID
- Admin username
- Action performed
- Timestamp
- Result/error

---

## 🔧 Troubleshooting

### Commands not appearing?

**Issue:** `/admin` command doesn't show up

**Solutions:**
1. Check CLIENT_ID is correct in `.env`
2. Run `npm run deploy` again
3. Wait 1-2 minutes for Discord to sync
4. Try restarting Discord app
5. Kick and re-invite bot with `applications.commands` scope

**Re-invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

### "Access Denied" error?

**Issue:** Command says you don't have permission

**Check:**
- Do you have Administrator, Manage Guild, or Manage Channels?
- Are you testing in DMs? (Commands only work in servers)
- Is the bot role above your role?

---

### "Command not found" error?

**Issue:** Bot says command doesn't exist

**Solutions:**
1. Check bot logs - are commands loaded?
2. Look for: `✓ Loaded command: /admin`
3. If missing, check src/commands/admin.js exists
4. Restart bot: `npm start`

---

### "Channel not found" for force-delete?

**Issue:** Bot can't find the channel

**Check:**
- Is the channel ID correct?
- Does the channel still exist?
- Is it in the correct server?
- Try right-click → Copy ID (enable Developer Mode)

---

## 📊 Monitoring Admin Actions

All admin commands are logged. Check logs with:

```bash
# Docker
docker compose logs -f | grep "Admin"

# Direct
tail -f logs/bot.log | grep "Admin"
```

**Example log entries:**
```
Admin forced channel deletion {adminId: "123", channelId: "456", channelName: "Room"}
Admin cleared all caches {adminId: "123", entriesCleared: 142}
Admin reset user rate limits {adminId: "123", targetUserId: "789"}
Admin exported database {adminId: "123", channelCount: 15}
```

---

## 🎯 Best Practices

### 1. Regular Cleanup
Run `/admin cleanup` weekly to remove orphaned channels.

### 2. Monitor Stats
Check `/admin stats` daily to monitor bot health.

### 3. Backup Database
Export database with `/admin export-db` before major updates.

### 4. Clear Cache Carefully
Only use `/admin clear-cache` when necessary (after updates or issues).

### 5. Document Force Actions
When using `force-delete` or `force-transfer`, document the reason.

### 6. Rate Limit Resets
Be cautious with `/admin reset-ratelimit` - only use for valid reasons.

---

## 🚀 Advanced Usage

### Combining Commands

**Example: Full Maintenance**
```
1. /admin stats          # Check current status
2. /admin cleanup        # Remove orphaned channels
3. /admin clear-cache    # Clear caches
4. /admin reload-config  # Reload configuration
5. /admin stats          # Verify improvements
```

### Automated Backups

Create a cron job for regular backups:

```bash
# Every Sunday at 3 AM
0 3 * * 0 /path/to/backup-script.sh
```

**backup-script.sh:**
```bash
#!/bin/bash
echo "/admin export-db" | /path/to/discord-message-sender
```

---

## 📚 API Integration

Commands can also be triggered programmatically:

```javascript
import AdminService from './src/services/AdminService.js';

// Example: Cleanup in code
const result = await AdminService.cleanupOrphanedChannels(client, adminMember);
console.log(`Cleaned ${result.channelsDeleted} channels`);

// Example: Get stats
const stats = AdminService.getSystemStats(client, adminMember);
console.log('Bot uptime:', stats.bot.uptime);
```

---

## 🔗 Related Documentation

- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - AdminService API documentation
- [README.md](./README.md) - General bot documentation
- [FEATURES.md](./FEATURES.md) - Complete feature list
- [DASHBOARD.md](./DASHBOARD.md) - Dashboard guide

---

## 💡 Tips

- **Autocomplete:** Discord will suggest parameters as you type
- **History:** Use ↑ arrow to repeat last command
- **Permissions:** Slash commands respect Discord permissions automatically
- **Offline:** Commands won't work if bot is offline (check with `/admin stats` from another admin)

---

## ❓ FAQ

### Can I use commands in DMs?
No, admin commands only work in servers.

### Can I customize command permissions?
Yes, use Discord's built-in Integrations → Bot → Commands settings.

### Can I add more commands?
Yes! Create new files in `src/commands/` following the pattern in `admin.js`.

### Do commands work in all channels?
Yes, but you can restrict them via Discord's channel permissions.

### Are commands rate-limited?
Slash commands have separate rate limits from interactions.

---

## 🎉 Quick Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `/admin stats` | System info | - |
| `/admin cleanup` | Remove empty channels | - |
| `/admin clear-cache` | Clear caches | - |
| `/admin reload-config` | Reload config | - |
| `/admin force-delete` | Delete channel | `channel_id:123...` |
| `/admin force-transfer` | Transfer ownership | `channel_id:123... new_owner:@User` |
| `/admin reset-ratelimit` | Reset limits | `user:@User` |
| `/admin export-db` | Backup database | - |

---

*Last updated: 2025-11-02*
*TempVoice Version: 2.0.0*
