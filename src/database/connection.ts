import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('database:connection');

let db: Database.Database | null = null;

/**
 * Initializes the SQLite database, creating the directory and running migrations if needed.
 * @returns The initialized database instance
 */
export function initializeDatabase(): Database.Database {
  if (db) return db;

  const dbPath = config.database.path;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory at ${dbDir}`);
  }

  db = new Database(dbPath);
  
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
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

function runMigrations(database: Database.Database): void {
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
