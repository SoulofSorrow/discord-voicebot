import { VoiceChannelService } from '../services/VoiceChannelService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { metrics } from '../utils/MetricsCollector.js';

export default async (client, oldState, newState) => {
  try {
    const service = new VoiceChannelService(client);
    
    // User joined a channel
    if (!oldState.channel && newState.channel) {
      await service.handleUserJoin(oldState, newState);
      metrics.recordInteraction('voice_join');
    }
    
    // User left a channel  
    else if (oldState.channel && !newState.channel) {
      await service.handleUserLeave(oldState, newState);
      metrics.recordInteraction('voice_leave');
    }
    
    // User switched channels
    else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      await service.handleUserSwitch(oldState, newState);
      metrics.recordInteraction('voice_switch');
    }
    
  } catch (error) {
    await ErrorHandler.handle(error, null, client, 'voiceStateUpdate');
    metrics.recordError('voice_state_update');
  }
};
