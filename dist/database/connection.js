"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('database:connection');
let db = null;
/**
 * Initializes the SQLite database, creating the directory and running migrations if needed.
 * @returns The initialized database instance
 */
function initializeDatabase() {
    if (db)
        return db;
    const dbPath = config_1.config.database.path;
    const dbDir = path_1.default.dirname(dbPath);
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
        logger.info(`Created database directory at ${dbDir}`);
    }
    db = new better_sqlite3_1.default(dbPath);
    // Use WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    logger.info('Database connected with WAL mode');
    runMigrations(db);
    return db;
}
/**
 * Gets the initialized database instance.
 * @throws Error if the database has not been initialized
 * @returns The database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}
function runMigrations(database) {
    logger.info('Running database migrations...');
    database.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      reaction_translation_enabled INTEGER DEFAULT 1,
      allow_hindi INTEGER DEFAULT 1,
      allow_english INTEGER DEFAULT 1,
      delete_on_reaction_remove INTEGER DEFAULT 1,
      max_message_length INTEGER DEFAULT 2000,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS channel_settings (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id)
    );

    CREATE TABLE IF NOT EXISTS translation_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_message_id TEXT NOT NULL,
      source_channel_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      target_language TEXT NOT NULL,
      translation_message_id TEXT NOT NULL,
      requesting_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mapping_source ON translation_mappings(source_message_id, target_language);
    CREATE INDEX IF NOT EXISTS idx_mapping_translation ON translation_mappings(translation_message_id);
  `);
    logger.info('Database migrations completed');
}
//# sourceMappingURL=connection.js.map