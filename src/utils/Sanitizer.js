/**
 * Input sanitization service
 * Removes dangerous characters and prevents injection attacks
 *
 * @class Sanitizer
 */
export class Sanitizer {
  /**
   * Profanity/inappropriate word blacklist
   * @private
   */
  static PROFANITY_BLACKLIST = [
    // English profanity (common variants)
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'bastard', 'cunt',
    'dick', 'pussy', 'cock', 'fag', 'nigger', 'nigga', 'retard', 'rape',
    // German profanity
    'scheiße', 'scheisse', 'fick', 'arsch', 'hurensohn', 'wichser', 'fotze',
    // Leetspeak/obfuscation common patterns
    'f*ck', 'sh*t', 'b*tch', 'a$$', 'd*mn', 'h3ll', 'fvck', 'shlt',
    // Slurs and hate speech
    'kike', 'spic', 'chink', 'gook', 'nazi', 'hitler',
  ];

  /**
   * Check if text contains profanity
   * @param {string} text - Text to check
   * @returns {boolean} True if profanity detected
   */
  static containsProfanity(text) {
    if (!text || typeof text !== 'string') return false;

    // Normalize text for detection (handle common obfuscation)
    const normalized = text.toLowerCase()
      .replace(/\*/g, 'u')  // f*ck → fuck
      .replace(/0/g, 'o')   // sh0t → shot
      .replace(/1/g, 'i')   // sh1t → shit
      .replace(/3/g, 'e')   // h3ll → hell
      .replace(/5/g, 's')   // a55 → ass
      .replace(/\$/g, 's'); // a$$ → ass

    return this.PROFANITY_BLACKLIST.some(word => {
      const pattern = word.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Create regex with word boundaries to avoid false positives
      // Matches standalone words or words with non-alphanumeric separators
      const regex = new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i');

      return regex.test(normalized);
    });
  }

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

    // Remove all HTML tags iteratively (handles nested tags like <<script>script>)
    // Keep removing until no more tags are found
    let previousText;
    do {
      previousText = text;
      text = text.replace(/<[^>]*>/g, '');
    } while (text !== previousText && text.includes('<'));

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
