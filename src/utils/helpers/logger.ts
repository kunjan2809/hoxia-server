// ============================================================================
// IMPORTS
// ============================================================================

// No external imports

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colorize: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

class Logger {
  private config: LoggerConfig;
  private context: string | undefined;

  constructor(context?: string) {
    this.context = context;
    this.config = {
      level: this.getLogLevel(),
      timestamp: true,
      colorize: process.env['NODE_ENV'] !== 'production',
    };
  }

  private getLogLevel(): LogLevel {
    const level = process.env['LOG_LEVEL']?.toUpperCase();
    switch (level) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return process.env['NODE_ENV'] === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private colorize(text: string, color: keyof typeof Colors): string {
    if (!this.config.colorize) return text;
    return `${Colors[color]}${text}${Colors.reset}`;
  }

  private formatMessage(level: string, message: string, meta?: unknown): string {
    const parts: string[] = [];

    if (this.config.timestamp) {
      parts.push(this.colorize(`[${this.formatTimestamp()}]`, 'gray'));
    }

    parts.push(level);

    if (this.context) {
      parts.push(this.colorize(`[${this.context}]`, 'cyan'));
    }

    parts.push(message);

    if (meta !== undefined) {
      if (meta instanceof Error) {
        parts.push(`\n${this.colorize(meta.stack ?? meta.message, 'red')}`);
      } else if (typeof meta === 'object') {
        parts.push(`\n${JSON.stringify(meta, null, 2)}`);
      } else {
        parts.push(String(meta));
      }
    }

    return parts.join(' ');
  }

  debug(message: string, meta?: unknown): void {
    if (this.config.level > LogLevel.DEBUG) return;
    const level = this.colorize('[DEBUG]', 'magenta');
    console.debug(this.formatMessage(level, message, meta));
  }

  info(message: string, meta?: unknown): void {
    if (this.config.level > LogLevel.INFO) return;
    const level = this.colorize('[INFO]', 'green');
    console.info(this.formatMessage(level, message, meta));
  }

  warn(message: string, meta?: unknown): void {
    if (this.config.level > LogLevel.WARN) return;
    const level = this.colorize('[WARN]', 'yellow');
    console.warn(this.formatMessage(level, message, meta));
  }

  error(message: string, meta?: unknown): void {
    if (this.config.level > LogLevel.ERROR) return;
    const level = this.colorize('[ERROR]', 'red');
    console.error(this.formatMessage(level, message, meta));
  }

  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context);
  }

  http(method: string, url: string, statusCode: number, duration: number): void {
    const statusColor =
      statusCode >= 500 ? 'red' : statusCode >= 400 ? 'yellow' : statusCode >= 300 ? 'cyan' : 'green';

    const methodColor = this.colorize(method.padEnd(7), 'bright');
    const status = this.colorize(String(statusCode), statusColor);
    const time = this.colorize(`${duration}ms`, 'gray');

    this.info(`${methodColor} ${url} ${status} ${time}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const logger = new Logger();

export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

export { Logger, LogLevel };

