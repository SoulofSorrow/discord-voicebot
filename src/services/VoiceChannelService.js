import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { ValidationService } from '../utils/ValidationService.js';
import { OwnershipManager } from '../utils/OwnershipManager.js';
import { metrics } from '../utils/MetricsCollector.js';
import { log } from '../utils/logger.js';
import t from '../utils/t.js';

export class VoiceChannelService {
  constructor(client) {
    this.client = client;
  }
  
  async createTempChannel(member, guild) {
    try {
      const channelName = `${member.user.username} - room`;
      
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: process.env.CATEGORY_CHANNEL_ID,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageRoles,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.ViewChannel
            ]
          }
        ]
      });
      
      this.client.tempVoiceOwners.set(channel.id, member.id);
      metrics.increment('channelsCreated');
      
      log('log_joined', this.client, {
        user: member.user.username,
        channel: channel.name
      });
      
      return channel;
    } catch (error) {
      await ErrorHandler.handle(error, null, this.client, 'createTempChannel');
      throw error;
    }
  }
  
  async deleteChannel(channel, reason = 'empty') {
    if (!this.client.channels.cache.has(channel.id)) return;

    try {
      const channelName = channel.name;
      await channel.delete();
      
      if (!this.client.deletedByInteraction?.has(channel.id)) {
        log('log_deleted', this.client, { channel: channelName });
      }
      
      OwnershipManager.cleanup(this.client, channel.id);
      this.client.deletedByInteraction?.delete(channel.id);
      metrics.increment('channelsDeleted');
      
    } catch (err) {
      if (err.code === 10003) { // Unknown Channel
        log('log_channel_already_deleted', this.client, { channel: channel.name });
        OwnershipManager.cleanup(this.client, channel.id);
      } else {
        log('log_channel_delete_failed', this.client, { channel: channel.name });
        metrics.recordError('channel_delete_failed');
      }
    }
  }
  
  async handleUserJoin(oldState, newState) {
    const member = newState.member;
    const newChannel = newState.channel;
    
    if (newChannel.id === process.env.VOICE_CHANNEL_ID) {
      const tempChannel = await this.createTempChannel(member, newChannel.guild);
      await newState.setChannel(tempChannel);
      
      log('log_switched', this.client, {
        user: member.user.username,
        from: newChannel.name,
        to: tempChannel.name
      });
    } else {
      log('log_joined', this.client, {
        user: member.user.username,
        channel: newChannel.name
      });
    }
  }
  
  async handleUserLeave(oldState, newState) {
    const member = oldState.member;
    const oldChannel = oldState.channel;
    
    log('log_left', this.client, {
      user: member.user.username,
      channel: oldChannel.name
    });
    
    const isOwner = OwnershipManager.check(this.client, oldChannel.id, member.id);
    const isEmpty = oldChannel.members.size === 0;
    
    if (isEmpty && isOwner) {
      await this.deleteChannel(oldChannel, 'owner_left');
    }
  }
  
  async handleUserSwitch(oldState, newState) {
    const member = newState.member;
    const oldChannel = oldState.channel;
    
    // Handle new channel
    await this.handleUserJoin(null, newState);
    
    // Cleanup old channel if needed
    const isOwner = OwnershipManager.check(this.client, oldChannel.id, member.id);
    const isEmpty = oldChannel.members.size === 0;
    
    if (isEmpty && isOwner) {
      await this.deleteChannel(oldChannel, 'owner_switched');
    }
  }
}
