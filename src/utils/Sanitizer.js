export class Sanitizer {
  static sanitizeChannelName(name) {
    if (!name) return '';

    return name
      .trim()
      .replace(/[^\w\s\-_]/g, '') // Nur Buchstaben, Zahlen, Leerzeichen, Bindestriche, Unterstriche
      .replace(/\s+/g, ' ') // Mehrfache Leerzeichen reduzieren
      .substring(0, 100);
  }

  static sanitizeUserId(id) {
    // Direkte Validierung ohne import um zirkuläre Abhängigkeit zu vermeiden
    return /^\d{17,19}$/.test(id) ? id : null;
  }

  static sanitizeInput(input, maxLength = 1000) {
    if (!input) return '';
    return input.toString().trim().substring(0, maxLength);
  }
}
