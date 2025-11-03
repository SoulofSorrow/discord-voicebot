import config from '../../config/config.js';

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * Structured logger with JSON output support
 */
export class StructuredLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'tempvoice';
    this.environment = process.env.NODE_ENV || 'development';
    this.minLevel = options.minLevel || LogLevel.INFO;
    this.useJSON = options.useJSON !== undefined ? options.useJSON : process.env.LOG_FORMAT === 'json';
    this.levels = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
      fatal: 50
    };
  }

  /**
   * Check if level should be logged
   * @private
   */
  _shouldLog(level) {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  /**
   * Format log entry
   * @private
   */
  _format(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...metadata
    };

    // Add trace info for errors
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      if (metadata.error instanceof Error) {
        entry.error = {
          message: metadata.error.message,
          stack: metadata.error.stack,
          code: metadata.error.code
        };
        delete entry.error; // Remove from top level
      }
    }

    if (this.useJSON) {
      return JSON.stringify(entry);
    }

    // Human-readable format
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💀'
    }[level] || 'ℹ️';

    let formatted = `${timestamp} ${emoji} [${level.toUpperCase()}] ${message}`;

    // Add metadata
    const metaKeys = Object.keys(metadata).filter(k => k !== 'error');
    if (metaKeys.length > 0) {
      const metaStr = metaKeys.map(k => `${k}=${JSON.stringify(metadata[k])}`).join(' ');
      formatted += ` | ${metaStr}`;
    }

    // Add error details
    if (metadata.error instanceof Error) {
      formatted += `\n  Error: ${metadata.error.message}`;
      if (this.minLevel === LogLevel.DEBUG) {
        formatted += `\n  Stack: ${metadata.error.stack}`;
      }
    }

    return formatted;
  }

  /**
   * Write log entry
   * @private
   */
  _write(level, message, metadata = {}) {
    if (!this._shouldLog(level)) {
      return;
    }

    const formatted = this._format(level, message, metadata);

    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log debug message
   */
  debug(message, metadata = {}) {
    this._write(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    this._write(LogLevel.INFO, message, metadata);
  }

  /**
   * Log warning
   */
  warn(message, metadata = {}) {
    this._write(LogLevel.WARN, message, metadata);
  }

  /**
   * Log error
   */
  error(message, metadata = {}) {
    this._write(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log fatal error
   */
  fatal(message, metadata = {}) {
    this._write(LogLevel.FATAL, message, metadata);
  }

  /**
   * Log with custom level
   */
  log(level, message, metadata = {}) {
    this._write(level, message, metadata);
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    const childLogger = new StructuredLogger({
      serviceName: this.serviceName,
      minLevel: this.minLevel,
      useJSON: this.useJSON
    });

    // Override write to include context
    const originalWrite = childLogger._write.bind(childLogger);
    childLogger._write = (level, message, metadata = {}) => {
      originalWrite(level, message, { ...context, ...metadata });
    };

    return childLogger;
  }

  /**
   * Log bot event
   */
  event(eventName, data = {}) {
    this.info(`Event: ${eventName}`, {
      event: eventName,
      eventType: 'bot_event',
      ...data
    });
  }

  /**
   * Log user interaction
   */
  interaction(userId, action, data = {}) {
    this.info(`Interaction: ${action}`, {
      userId,
      action,
      eventType: 'user_interaction',
      ...data
    });
  }

  /**
   * Log channel operation
   */
  channelOp(channelId, operation, data = {}) {
    this.info(`Channel operation: ${operation}`, {
      channelId,
      operation,
      eventType: 'channel_operation',
      ...data
    });
  }

  /**
   * Log performance metric
   */
  metric(metricName, value, unit = '', tags = {}) {
    this.debug(`Metric: ${metricName}`, {
      metric: metricName,
      value,
      unit,
      eventType: 'metric',
      ...tags
    });
  }

  /**
   * Log API call
   */
  apiCall(endpoint, method, statusCode, duration, data = {}) {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, `API Call: ${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode,
      duration,
      eventType: 'api_call',
      ...data
    });
  }
}

// Export singleton logger
export const logger = new StructuredLogger({
  serviceName: 'tempvoice',
  minLevel: process.env.LOG_LEVEL || LogLevel.INFO,
  useJSON: process.env.LOG_FORMAT === 'json'
});

export { LogLevel };
