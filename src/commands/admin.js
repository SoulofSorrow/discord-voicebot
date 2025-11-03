import { SlashCommandBuilder, PermissionFlagBits } from 'discord.js';
import AdminService from '../services/AdminService.js';
import { createEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Admin commands for bot management')
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
      .setName('reload-config')
      .setDescription('Reload configuration without restart'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('force-delete')
      .setDescription('Force delete a temporary voice channel')
      .addStringOption(option =>
        option
          .setName('channel_id')
          .setDescription('ID of the channel to delete')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('force-transfer')
      .setDescription('Force transfer channel ownership')
      .addStringOption(option =>
        option
          .setName('channel_id')
          .setDescription('ID of the channel')
          .setRequired(true))
      .addUserOption(option =>
        option
          .setName('new_owner')
          .setDescription('New owner of the channel')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset-ratelimit')
      .setDescription('Reset rate limits for a user')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to reset rate limits for')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('export-db')
      .setDescription('Export database to JSON'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const member = interaction.member;

  // Check admin permissions
  if (!AdminService.isAdmin(member)) {
    return interaction.reply({
      embeds: [createEmbed(
        '❌ Access Denied',
        'You need Administrator, Manage Guild, or Manage Channels permission to use this command.',
        0xff0000
      )],
      ephemeral: true
    });
  }

  try {
    switch (subcommand) {
      case 'stats':
        await handleStats(interaction);
        break;
      case 'cleanup':
        await handleCleanup(interaction);
        break;
      case 'clear-cache':
        await handleClearCache(interaction);
        break;
      case 'reload-config':
        await handleReloadConfig(interaction);
        break;
      case 'force-delete':
        await handleForceDelete(interaction);
        break;
      case 'force-transfer':
        await handleForceTransfer(interaction);
        break;
      case 'reset-ratelimit':
        await handleResetRateLimit(interaction);
        break;
      case 'export-db':
        await handleExportDB(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Unknown subcommand',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Admin command error:', error);

    const errorMessage = error.message || 'Unknown error occurred';

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        embeds: [createEmbed(
          '❌ Command Failed',
          `Error: ${errorMessage}`,
          0xff0000
        )]
      });
    } else {
      await interaction.reply({
        embeds: [createEmbed(
          '❌ Command Failed',
          `Error: ${errorMessage}`,
          0xff0000
        )],
        ephemeral: true
      });
    }
  }
}

async function handleStats(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const stats = AdminService.getSystemStats(interaction.client, interaction.member);

  const embed = {
    title: '📊 System Statistics',
    color: 0x5865f2,
    fields: [
      {
        name: '🤖 Bot',
        value: [
          `Uptime: ${formatUptime(stats.bot.uptime)}`,
          `Memory: ${formatBytes(stats.bot.memory.heapUsed)}`,
          `Node: ${stats.bot.nodeVersion}`
        ].join('\n'),
        inline: true
      },
      {
        name: '📺 Channels',
        value: [
          `Active: ${stats.channels.active}`,
          `Database: ${stats.channels.inDatabase}`
        ].join('\n'),
        inline: true
      },
      {
        name: '💾 Cache',
        value: `Entries: ${stats.cache.size}`,
        inline: true
      },
      {
        name: '⏱️ Rate Limits',
        value: [
          `User Limits: ${stats.rateLimits.userLimits}`,
          `Channel Limits: ${stats.rateLimits.channelLimits}`,
          `Global Limits: ${stats.rateLimits.globalLimits}`,
          `Violations: ${stats.rateLimits.violations}`
        ].join('\n'),
        inline: true
      },
      {
        name: '🔍 Monitoring',
        value: [
          `Ready: ${stats.monitoring.ready ? '✅' : '❌'}`,
          `Database: ${stats.monitoring.database ? '✅' : '❌'}`,
          `Cache: ${stats.monitoring.cache ? '✅' : '❌'}`
        ].join('\n'),
        inline: true
      }
    ],
    timestamp: new Date(),
    footer: {
      text: `Requested by ${interaction.user.username}`
    }
  };

  await interaction.editReply({ embeds: [embed] });
}

async function handleCleanup(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const result = await AdminService.cleanupOrphanedChannels(
    interaction.client,
    interaction.member
  );

  const embed = createEmbed(
    '🧹 Cleanup Complete',
    [
      `Deleted ${result.channelsDeleted} orphaned channels.`,
      result.channelsDeleted > 0
        ? `\nChannel IDs: ${result.channels.slice(0, 5).join(', ')}${result.channels.length > 5 ? '...' : ''}`
        : ''
    ].join('\n'),
    result.channelsDeleted > 0 ? 0x57f287 : 0x5865f2
  );

  await interaction.editReply({ embeds: [embed] });
}

async function handleClearCache(interaction) {
  const result = AdminService.clearCaches(interaction.member);

  const embed = createEmbed(
    '🧹 Cache Cleared',
    `Successfully cleared ${result.entriesCleared} cache entries.`,
    0x57f287
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleReloadConfig(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const result = await AdminService.reloadConfig(interaction.member);

  const embed = {
    title: '🔄 Configuration Reloaded',
    color: 0x57f287,
    fields: [
      {
        name: 'New Configuration',
        value: [
          `Language: ${result.config.language}`,
          `Logging: ${result.config.log ? 'Enabled' : 'Disabled'}`,
          `Label: ${result.config.label}`
        ].join('\n')
      }
    ],
    timestamp: new Date()
  };

  await interaction.editReply({ embeds: [embed] });
}

async function handleForceDelete(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channelId = interaction.options.getString('channel_id');

  const result = await AdminService.forceDeleteChannel(
    interaction.client,
    channelId,
    interaction.member
  );

  if (!result.success) {
    const embed = createEmbed(
      '❌ Delete Failed',
      result.reason || 'Unknown error',
      0xff0000
    );
    return interaction.editReply({ embeds: [embed] });
  }

  const embed = createEmbed(
    '🗑️ Channel Deleted',
    [
      `**Channel:** ${result.channelName}`,
      `**Owner:** <@${result.ownerId}>`,
      `**Channel ID:** ${channelId}`
    ].join('\n'),
    0x57f287
  );

  await interaction.editReply({ embeds: [embed] });
}

async function handleForceTransfer(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channelId = interaction.options.getString('channel_id');
  const newOwner = interaction.options.getUser('new_owner');

  const result = await AdminService.forceTransferOwnership(
    interaction.client,
    channelId,
    newOwner.id,
    interaction.member
  );

  const embed = createEmbed(
    '🔄 Ownership Transferred',
    [
      `**Channel ID:** ${channelId}`,
      `**Old Owner:** <@${result.oldOwnerId}>`,
      `**New Owner:** ${newOwner}`,
      `\nOwnership has been forcefully transferred.`
    ].join('\n'),
    0x57f287
  );

  await interaction.editReply({ embeds: [embed] });
}

async function handleResetRateLimit(interaction) {
  const user = interaction.options.getUser('user');

  const result = AdminService.resetUserRateLimit(user.id, interaction.member);

  const embed = createEmbed(
    '⏱️ Rate Limit Reset',
    `Successfully reset all rate limits for ${user}.`,
    0x57f287
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleExportDB(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const backup = AdminService.exportDatabase(interaction.member);

  // Create JSON file
  const jsonData = JSON.stringify(backup, null, 2);
  const buffer = Buffer.from(jsonData, 'utf-8');

  const timestamp = new Date(backup.timestamp).toISOString().split('T')[0];
  const filename = `tempvoice-backup-${timestamp}.json`;

  const embed = createEmbed(
    '💾 Database Export',
    [
      `**Channels:** ${backup.channels.length}`,
      `**Permissions:** ${backup.permissions.length}`,
      `**Metrics:** ${backup.metrics.length}`,
      `\nBackup file attached.`
    ].join('\n'),
    0x57f287
  );

  await interaction.editReply({
    embeds: [embed],
    files: [{
      attachment: buffer,
      name: filename
    }]
  });
}

// Helper functions
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}
