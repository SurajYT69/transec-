"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
exports.sanitize = sanitize;
const pino_1 = __importDefault(require("pino"));
// Use process.env directly here to avoid circular dependency with config
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_DEV = process.env.NODE_ENV !== 'production';
exports.logger = (0, pino_1.default)({
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
function createLogger(name) {
    return exports.logger.child({ name });
}
/**
 * Sanitizes a string for safe logging by truncating it if it's too long.
 * @param text The text to sanitize
 * @param maxLength The maximum length of the string (default: 100)
 * @returns The sanitized string
 */
function sanitize(text, maxLength = 100) {
    if (!text)
        return text;
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
}
//# sourceMappingURL=logger.js.map