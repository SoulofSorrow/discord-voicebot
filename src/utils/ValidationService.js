export class ValidationService {
  static validateChannelName(name) {
    if (!name || typeof name !== 'string') return { valid: false, error: 'invalid_name' };
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      return { valid: false, error: 'invalid_name_length' };
    }
    return { valid: true, value: trimmed };
  }
  
  static validateUserLimit(limit) {
    const num = parseInt(limit);
    if (isNaN(num) || num < 0 || num > 99) {
      return { valid: false, error: 'invalid_limit' };
    }
    return { valid: true, value: num };
  }
  
  static validateOwnership(client, channelId, userId) {
    return {
      isOwner: client.tempVoiceOwners?.get(channelId) === userId,
      ownerId: client.tempVoiceOwners?.get(channelId)
    };
  }
  
  static validateVoiceChannel(member) {
    const channel = member?.voice?.channel;
    return {
      isValid: !!channel,
      channel,
      isInCategory: channel?.parentId === process.env.CATEGORY_CHANNEL_ID,
      isEmpty: channel?.members?.size === 0
    };
  }
  
  static validateUserId(id) {
    return /^\d{17,19}$/.test(id) ? id : null;
  }
}
