"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function optionalEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
}
function optionalInt(key, defaultValue) {
    const value = process.env[key];
    if (!value)
        return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid integer for environment variable ${key}: ${value}`);
    }
    return parsed;
}
exports.config = {
    // Discord
    discord: {
        token: requireEnv('DISCORD_TOKEN'),
        clientId: requireEnv('DISCORD_CLIENT_ID'),
    },
    // Providers
    providers: {
        gemini: {
            apiKey: optionalEnv('GEMINI_API_KEY', ''),
            model: optionalEnv('GEMINI_MODEL', 'gemini-3.1-flash-lite'),
        },
        azure: {
            key: optionalEnv('AZURE_TRANSLATOR_KEY', ''),
            region: optionalEnv('AZURE_TRANSLATOR_REGION', 'eastus'),
            endpoint: optionalEnv('AZURE_TRANSLATOR_ENDPOINT', 'https://api.cognitive.microsofttranslator.com'),
        },
    },
    // Database
    database: {
        path: optionalEnv('DATABASE_PATH', path_1.default.join(process.cwd(), 'data', 'smarttranslate.db')),
    },
    // Logging
    logging: {
        level: optionalEnv('LOG_LEVEL', 'info'),
    },
    // Rate Limits
    rateLimits: {
        perUser: {
            maxRequests: optionalInt('RATE_LIMIT_PER_USER', 10),
            windowMs: optionalInt('RATE_LIMIT_WINDOW_SECONDS', 60) * 1000,
        },
        perGuild: {
            maxRequests: optionalInt('RATE_LIMIT_PER_GUILD', 50),
            windowMs: optionalInt('RATE_LIMIT_WINDOW_SECONDS', 60) * 1000,
        },
    },
    // Cache
    cache: {
        maxSize: optionalInt('CACHE_MAX_SIZE', 1000),
        ttlMs: optionalInt('CACHE_TTL_SECONDS', 3600) * 1000,
    },
    // Translation
    translation: {
        maxMessageLength: optionalInt('MAX_MESSAGE_LENGTH', 2000),
        timeoutMs: optionalInt('TRANSLATION_TIMEOUT_MS', 10000),
        maxRetries: 2,
    },
};
//# sourceMappingURL=config.js.map