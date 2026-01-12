# 🛡️ Admin-Funktionen - Vollständige Anleitung

Der TempVoice Bot verfügt über 8 leistungsstarke Admin-Befehle zur Verwaltung und Überwachung.

---

## 👑 Wer ist Admin?

Ein Benutzer ist **automatisch Admin**, wenn er **mindestens eine** dieser Discord-Berechtigungen hat:

```javascript
✅ Administrator           // Volle Server-Berechtigung
✅ Server verwalten        // ManageGuild
✅ Kanäle verwalten        // ManageChannels
```

**Keine Konfiguration nötig!** Die Berechtigungen werden direkt aus Discord-Rollen übernommen.

**Code-Referenz:** `src/services/AdminService.js:18-28`

```javascript
static isAdmin(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels)
  );
}
```

---

## 📋 Verfügbare Admin-Befehle

### 1️⃣ Force Delete Channel
**Befehl:** `force-delete <channelId>`
**Zweck:** Channel zwangsweise löschen (Admin-Override)

**Funktionsweise:**
- Umgeht Owner-Rechte
- Löscht Channel sofort
- Entfernt aus Datenbank
- Bereinigt tempVoiceOwners Map
- Logged Admin-Aktion

**Code-Referenz:** `src/services/AdminService.js:37-83`

**Verwendung:**
```javascript
await AdminService.forceDeleteChannel(client, '123456789', adminMember);
```

**Rückgabe:**
```javascript
{
  success: true,
  channelName: "User's Channel",
  ownerId: "987654321"
}
```

---

### 2️⃣ Force Transfer Ownership
**Befehl:** `force-transfer <channelId> <newOwnerId>`
**Zweck:** Channel-Besitz zwangsweise übertragen

**Funktionsweise:**
- Überträgt Ownership ohne Zustimmung
- Updated tempVoiceOwners Map
- Speichert in Datenbank
- Logged Admin-Aktion mit altem & neuem Owner

**Code-Referenz:** `src/services/AdminService.js:93-125`

**Verwendung:**
```javascript
await AdminService.forceTransferOwnership(
  client,
  '123456789',      // channelId
  '111222333',      // newOwnerId
  adminMember
);
```

**Rückgabe:**
```javascript
{
  success: true,
  oldOwnerId: "987654321",
  newOwnerId: "111222333"
}
```

---

### 3️⃣ Reset Rate Limit
**Befehl:** `reset-ratelimit <userId>`
**Zweck:** Rate-Limits für einen Benutzer zurücksetzen

**Funktionsweise:**
- Löscht alle Rate-Limit-Einträge für User
- Ermöglicht sofortige Nutzung
- Nützlich bei False Positives

**Code-Referenz:** `src/services/AdminService.js:133-150`

**Verwendung:**
```javascript
AdminService.resetUserRateLimit('987654321', adminMember);
```

**Rückgabe:**
```javascript
{
  success: true,
  userId: "987654321"
}
```

---

### 4️⃣ Clear Cache
**Befehl:** `clear-cache`
**Zweck:** Alle Caches leeren

**Funktionsweise:**
- Leert den LRU-Cache komplett
- Gibt Speicher frei
- Nützlich bei Cache-Problemen
- Zeigt Anzahl gelöschter Einträge

**Code-Referenz:** `src/services/AdminService.js:157-175`

**Verwendung:**
```javascript
AdminService.clearCaches(adminMember);
```

**Rückgabe:**
```javascript
{
  success: true,
  entriesCleared: 142
}
```

---

### 5️⃣ Reload Config
**Befehl:** `reload-config`
**Zweck:** Konfiguration neu laden ohne Neustart

**Funktionsweise:**
- Lädt config.js neu
- Übernimmt neue Einstellungen
- Kein Bot-Neustart nötig
- Zeigt neue Config-Werte

**Code-Referenz:** `src/services/AdminService.js:182-215`

**Verwendung:**
```javascript
await AdminService.reloadConfig(adminMember);
```

**Rückgabe:**
```javascript
{
  success: true,
  config: {
    language: "de",
    log: true,
    label: "TempVoice"
  }
}
```

---

### 6️⃣ System Stats
**Befehl:** `stats`
**Zweck:** System-Statistiken anzeigen

**Funktionsweise:**
- Sammelt umfassende System-Infos
- Bot-Statistiken (Uptime, Memory, Node-Version)
- Channel-Statistiken (aktiv, in DB)
- Cache-Status
- Rate-Limit-Stats
- Monitoring-Status

**Code-Referenz:** `src/services/AdminService.js:223-253`

**Verwendung:**
```javascript
const stats = AdminService.getSystemStats(client, adminMember);
```

**Rückgabe:**
```javascript
{
  bot: {
    uptime: 3600.5,
    memory: {
      rss: 67108864,
      heapTotal: 45088768,
      heapUsed: 38764544,
      external: 2097152
    },
    nodeVersion: "v20.11.0"
  },
  channels: {
    active: 15,
    inDatabase: 15
  },
  cache: {
    size: 142
  },
  rateLimits: {
    userLimits: 45,
    channelLimits: 12,
    globalLimits: 8,
    violations: 3,
    total: 65
  },
  monitoring: {
    ready: true,
    database: true,
    cache: true
  }
}
```

---

### 7️⃣ Cleanup Orphaned Channels
**Befehl:** `cleanup`
**Zweck:** Leere/verwaiste Channels automatisch löschen

**Funktionsweise:**
- Scannt Category nach leeren Channels
- Löscht Channels ohne Mitglieder
- Bereinigt tempVoiceOwners Map
- Entfernt aus Datenbank
- Zeigt Anzahl gelöschter Channels

**Code-Referenz:** `src/services/AdminService.js:261-304`

**Verwendung:**
```javascript
await AdminService.cleanupOrphanedChannels(client, adminMember);
```

**Rückgabe:**
```javascript
{
  success: true,
  channelsDeleted: 3,
  channels: ["123456789", "234567890", "345678901"]
}
```

---

### 8️⃣ Export Database
**Befehl:** `export-db`
**Zweck:** Datenbank exportieren (Backup)

**Funktionsweise:**
- Exportiert alle Channels
- Exportiert alle Permissions
- Exportiert letzte 1000 Metrics
- Gibt JSON-Daten zurück
- Nützlich für Backups/Analysis

**Code-Referenz:** `src/services/AdminService.js:311-338`

**Verwendung:**
```javascript
const backup = AdminService.exportDatabase(adminMember);
```

**Rückgabe:**
```javascript
{
  timestamp: 1730579423000,
  channels: [
    {
      channel_id: "123456789",
      guild_id: "987654321",
      owner_id: "111222333",
      created_at: 1730579400000,
      settings: "{\"locked\":true}"
    }
  ],
  permissions: [
    {
      id: 1,
      channel_id: "123456789",
      user_id: "444555666",
      permission_type: "trust",
      created_at: 1730579410000
    }
  ],
  metrics: [...]
}
```

---

## 🔐 Sicherheit

### Admin-Checks
**Jede** Admin-Funktion prüft zuerst die Berechtigung:

```javascript
if (!this.isAdmin(admin)) {
  throw new Error('Insufficient permissions');
}
```

### Logging
**Alle** Admin-Aktionen werden geloggt:

```javascript
logger.warn('Admin forced channel deletion', {
  adminId: admin.id,
  adminName: admin.user.username,
  channelId,
  channelName,
  ownerId
});
```

### Audit Trail
Logs enthalten:
- ✅ Admin User ID
- ✅ Admin Username
- ✅ Aktion
- ✅ Betroffene Ressourcen
- ✅ Timestamp
- ✅ Ergebnis

---

## 💻 Programmierung: Admin-Befehle nutzen

### Beispiel 1: Admin-Slash-Command erstellen

```javascript
// commands/admin.js
import { SlashCommandBuilder, PermissionFlagBits } from 'discord.js';
import AdminService from '../services/AdminService.js';

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Admin commands')
  .setDefaultMemberPermissions(PermissionFlagBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('Show system statistics'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('cleanup')
      .setDescription('Cleanup orphaned channels'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('clear-cache')
      .setDescription('Clear all caches'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('force-delete')
      .setDescription('Force delete a channel')
      .addStringOption(option =>
        option.setName('channel_id')
          .setDescription('Channel ID to delete')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset-ratelimit')
      .setDescription('Reset rate limit for a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to reset')
          .setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const member = interaction.member;

  // Check admin permissions
  if (!AdminService.isAdmin(member)) {
    return interaction.reply({
      content: '❌ You need Administrator, Manage Guild, or Manage Channels permission.',
      ephemeral: true
    });
  }

  try {
    switch (subcommand) {
      case 'stats': {
        const stats = AdminService.getSystemStats(interaction.client, member);

        const embed = {
          title: '📊 System Statistics',
          color: 0x2f3136,
          fields: [
            {
              name: '🤖 Bot',
              value: `Uptime: ${Math.floor(stats.bot.uptime / 3600)}h\nMemory: ${Math.floor(stats.bot.memory.heapUsed / 1024 / 1024)}MB\nNode: ${stats.bot.nodeVersion}`,
              inline: true
            },
            {
              name: '📺 Channels',
              value: `Active: ${stats.channels.active}\nDatabase: ${stats.channels.inDatabase}`,
              inline: true
            },
            {
              name: '💾 Cache',
              value: `Entries: ${stats.cache.size}`,
              inline: true
            },
            {
              name: '⏱️ Rate Limits',
              value: `Total: ${stats.rateLimits.total}\nViolations: ${stats.rateLimits.violations}`,
              inline: true
            }
          ],
          timestamp: new Date()
        };

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      case 'cleanup': {
        await interaction.deferReply({ ephemeral: true });
        const result = await AdminService.cleanupOrphanedChannels(interaction.client, member);

        return interaction.editReply({
          content: `✅ Cleanup complete!\n🗑️ Deleted ${result.channelsDeleted} orphaned channels.`
        });
      }

      case 'clear-cache': {
        const result = AdminService.clearCaches(member);
        return interaction.reply({
          content: `✅ Cache cleared!\n🧹 Removed ${result.entriesCleared} entries.`,
          ephemeral: true
        });
      }

      case 'force-delete': {
        const channelId = interaction.options.getString('channel_id');
        await interaction.deferReply({ ephemeral: true });

        const result = await AdminService.forceDeleteChannel(
          interaction.client,
          channelId,
          member
        );

        return interaction.editReply({
          content: `✅ Channel deleted!\n📺 Channel: ${result.channelName}\n👤 Owner: <@${result.ownerId}>`
        });
      }

      case 'reset-ratelimit': {
        const user = interaction.options.getUser('user');
        const result = AdminService.resetUserRateLimit(user.id, member);

        return interaction.reply({
          content: `✅ Rate limits reset for <@${result.userId}>`,
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error('Admin command error:', error);
    return interaction.reply({
      content: `❌ Error: ${error.message}`,
      ephemeral: true
    });
  }
}
```

### Beispiel 2: Dashboard Integration

```javascript
// In DashboardService.js
app.post('/api/admin/cleanup', async (req, res) => {
  const { adminId } = req.body;

  // Get admin member
  const guild = client.guilds.cache.first();
  const member = await guild.members.fetch(adminId);

  if (!AdminService.isAdmin(member)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const result = await AdminService.cleanupOrphanedChannels(client, member);
  res.json(result);
});
```

---

## 🎯 Best Practices

### 1. Berechtigungen prüfen
```javascript
// ❌ Falsch - keine Prüfung
await AdminService.forceDeleteChannel(client, channelId, member);

// ✅ Richtig - mit Prüfung
if (AdminService.isAdmin(member)) {
  await AdminService.forceDeleteChannel(client, channelId, member);
} else {
  console.log('User is not an admin');
}
```

### 2. Fehlerbehandlung
```javascript
try {
  const result = await AdminService.cleanupOrphanedChannels(client, admin);
  console.log(`Cleaned up ${result.channelsDeleted} channels`);
} catch (error) {
  console.error('Cleanup failed:', error.message);
}
```

### 3. Logging beachten
Alle Admin-Aktionen werden automatisch geloggt. Nutze strukturiertes Logging:

```javascript
import { logger } from '../utils/StructuredLogger.js';

logger.info('Custom admin action', {
  adminId: admin.id,
  action: 'custom_task',
  details: { ... }
});
```

---

## 📊 Monitoring

### Admin-Aktionen überwachen

Alle Admin-Aktionen erscheinen in den Logs:

```bash
# Docker Logs
docker compose logs -f | grep "Admin"

# Beispiel-Output:
# Admin forced channel deletion {adminId: "123", channelId: "456"}
# Admin cleared all caches {adminId: "123", entriesCleared: 142}
# Admin cleaned up orphaned channels {adminId: "123", channelsDeleted: 3}
```

### Dashboard-Integration

Admin-Funktionen können ins Dashboard integriert werden:

```javascript
// Dashboard Button für Cleanup
<button onclick="cleanupChannels()">🧹 Cleanup Orphaned Channels</button>

<script>
async function cleanupChannels() {
  const response = await fetch('/api/admin/cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: YOUR_ADMIN_ID })
  });
  const result = await response.json();
  alert(`Cleaned up ${result.channelsDeleted} channels!`);
}
</script>
```

---

## ⚠️ Wichtige Hinweise

1. **Keine Discord-Commands registriert**
   - Admin-Funktionen sind als Service implementiert
   - Müssen manuell als Slash-Commands registriert werden (siehe Beispiel oben)
   - Oder über Dashboard/API aufgerufen werden

2. **Automatische Berechtigung**
   - Keine separate Admin-Liste
   - Basiert auf Discord-Rollen
   - Dynamisch - Rollenänderungen werden sofort erkannt

3. **Alle Aktionen sind geloggt**
   - Kann nicht umgangen werden
   - Audit Trail für alle Aktionen
   - Sichtbar in Logs und Monitoring

4. **Keine Undo-Funktion**
   - force-delete ist permanent
   - force-transfer ist sofort wirksam
   - Vorsicht bei Nutzung!

---

## 🔧 Troubleshooting

### "Insufficient permissions"
**Problem:** Admin-Befehl schlägt fehl
**Lösung:** Prüfe Discord-Rollen - User braucht Administrator, ManageGuild ODER ManageChannels

### "Channel not found"
**Problem:** force-delete findet Channel nicht
**Lösung:** Channel-ID prüfen, Channel könnte bereits gelöscht sein

### "Database not initialized"
**Problem:** export-db schlägt fehl
**Lösung:** Warte bis Bot vollständig gestartet ist, prüfe Datenbank-Logs

---

## 📚 Weitere Ressourcen

- **Code:** `src/services/AdminService.js`
- **Tests:** `test/AdminService.test.js` (kann erstellt werden)
- **Logging:** `src/utils/StructuredLogger.js`
- **Permissions:** `src/constants.js`

---

*Letzte Aktualisierung: 2025-11-02*
