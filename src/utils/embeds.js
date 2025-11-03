/**
 * Create a standard embed
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {number} color - Embed color (hex)
 * @returns {Object} Discord embed object
 */
export function createEmbed(title, description, color = 0x5865f2) {
  return {
    title,
    description,
    color,
    timestamp: new Date()
  };
}

/**
 * Create an error embed
 * @param {string} title - Error title
 * @param {string} description - Error description
 * @returns {Object} Discord embed object
 */
export function createErrorEmbed(title, description) {
  return createEmbed(title, description, 0xed4245);
}

/**
 * Create a success embed
 * @param {string} title - Success title
 * @param {string} description - Success description
 * @returns {Object} Discord embed object
 */
export function createSuccessEmbed(title, description) {
  return createEmbed(title, description, 0x57f287);
}

/**
 * Create a warning embed
 * @param {string} title - Warning title
 * @param {string} description - Warning description
 * @returns {Object} Discord embed object
 */
export function createWarningEmbed(title, description) {
  return createEmbed(title, description, 0xfee75c);
}

/**
 * Create an info embed
 * @param {string} title - Info title
 * @param {string} description - Info description
 * @returns {Object} Discord embed object
 */
export function createInfoEmbed(title, description) {
  return createEmbed(title, description, 0x5865f2);
}
