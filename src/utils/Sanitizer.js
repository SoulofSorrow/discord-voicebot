export class Sanitizer {
  static sanitizeChannelName(name) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return 'Unnamed Channel';
    }

    return name
      .trim()
      .replace(/[^\w\s\-_]/g, '') // Nur Buchstaben, Zahlen, Leerzeichen, Bindestriche, Unterstriche
      .replace(/\s+/g, ' ') // Mehrfache Leerzeichen reduzieren
      .substring(0, 100) || 'Unnamed Channel';
  }

  static sanitizeUserId(id) {
    if (!id) return null;

    // Remove mentions and non-numeric characters
    const cleaned = id.toString().replace(/[^\d]/g, '');

    // Validate Discord ID format (17-19 digits)
    return /^\d{17,19}$/.test(cleaned) ? cleaned : null;
  }

  static sanitizeInput(input, maxLength = 1000) {
    if (!input) return '';

    // Remove potentially dangerous content
    let sanitized = input.toString()
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/@(everyone|here)/gi, '') // Remove mass mentions
      .trim()
      .substring(0, maxLength);

    return sanitized;
  }

  static sanitizeNumber(input, min = 0, max = 100, defaultValue = 0) {
    const parsed = parseInt(input, 10);

    if (isNaN(parsed)) {
      return defaultValue;
    }

    if (parsed < min) return min;
    if (parsed > max) return max;

    return parsed;
  }
}
