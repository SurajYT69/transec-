import pino from 'pino';

// Use process.env directly here to avoid circular dependency with config
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_DEV = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: LOG_LEVEL,
  transport: IS_DEV ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

/**
 * Creates a child logger with a specific name.
 * @param name The name of the child logger
 * @returns A pino child logger
 */
export function createLogger(name: string) {
  return logger.child({ name });
}

/**
 * Sanitizes a string for safe logging by truncating it if it's too long.
 * @param text The text to sanitize
 * @param maxLength The maximum length of the string (default: 100)
 * @returns The sanitized string
 */
export function sanitize(text: string, maxLength: number = 100): string {
  if (!text) return text;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
