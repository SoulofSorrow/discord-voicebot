/**
 * Input sanitization service
 * Removes dangerous characters and prevents injection attacks
 *
 * @class Sanitizer
 */
export class Sanitizer {
  /**
   * Sanitize channel name for Discord
   * @param {string} name - Channel name to sanitize
   * @returns {string} Sanitized channel name
   * @example
   * Sanitizer.sanitizeChannelName('Test<script>') // 'Testscript'
   */
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

    // Remove potentially dangerous content by escaping HTML
    let sanitized = input.toString()
      // Escape HTML entities (defense in depth)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // Remove mass mentions
      .replace(/@(everyone|here)/gi, '')
      .trim()
      .substring(0, maxLength);

    return sanitized;
  }

  /**
   * Strip all HTML tags from input (for plain text contexts)
   * @param {string} input - Input string
   * @returns {string} String with all HTML tags removed
   */
  static stripHtml(input) {
    if (!input) return '';

    // First, decode HTML entities to normalize the input
    let text = input.toString();

    // Decode common HTML entities (iterative to handle nested encoding)
    for (let i = 0; i < 3; i++) {
      text = text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&'); // Decode & last
    }

    // Remove all HTML tags (now all tags are in normalized form)
    text = text.replace(/<[^>]*>/g, '');

    // Re-escape to prevent any HTML injection in the output
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
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
