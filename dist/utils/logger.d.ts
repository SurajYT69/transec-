import pino from 'pino';
export declare const logger: pino.Logger<never, boolean>;
/**
 * Creates a child logger with a specific name.
 * @param name The name of the child logger
 * @returns A pino child logger
 */
export declare function createLogger(name: string): pino.Logger<never, boolean>;
/**
 * Sanitizes a string for safe logging by truncating it if it's too long.
 * @param text The text to sanitize
 * @param maxLength The maximum length of the string (default: 100)
 * @returns The sanitized string
 */
export declare function sanitize(text: string, maxLength?: number): string;
//# sourceMappingURL=logger.d.ts.map