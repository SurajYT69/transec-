"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseCompat = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
const sql_js_1 = __importDefault(require("sql.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('database:connection');
class DatabaseCompat {
    db;
    filePath;
    constructor(db, filePath) {
        this.db = db;
        this.filePath = filePath;
    }
    exec(sql) {
        this.db.exec(sql);
        this.persist();
    }
    prepare(sql) {
        const db = this.db;
        const persist = () => this.persist();
        return {
            run(...params) {
                db.run(sql, params);
                persist();
                // Get last_insert_rowid and changes
                let lastId = 0;
                let changes = 0;
                try {
                    const resId = db.exec('SELECT last_insert_rowid() AS id');
                    if (resId.length && resId[0].values.length) {
                        lastId = Number(resId[0].values[0][0]);
                    }
                    const resChanges = db.exec('SELECT changes() AS ch');
                    if (resChanges.length && resChanges[0].values.length) {
                        changes = Number(resChanges[0].values[0][0]);
                    }
                }
                catch {
                    // ignore
                }
                return { changes, lastInsertRowid: lastId };
            },
            get(...params) {
                const stmt = db.prepare(sql);
                try {
                    stmt.bind(params);
                    if (stmt.step()) {
                        return stmt.getAsObject();
                    }
                    return undefined;
                }
                finally {
                    stmt.free();
                }
            },
        };
    }
    persist() {
        try {
            const data = this.db.export();
            const buffer = Buffer.from(data);
            fs_1.default.writeFileSync(this.filePath, buffer);
        }
        catch (err) {
            logger.error({ error: err.message }, 'Failed to persist SQLite database');
        }
    }
}
exports.DatabaseCompat = DatabaseCompat;
let dbInstance = null;
/**
 * Initializes the pure JavaScript SQLite database (sql.js / WebAssembly).
 * Does not require any native C++ node-gyp compilation or prebuild binaries.
 */
async function initializeDatabase() {
    if (dbInstance)
        return dbInstance;
    const dbPath = config_1.config.database.path;
    const dbDir = path_1.default.dirname(dbPath);
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
        logger.info(`Created database directory at ${dbDir}`);
    }
    const SQL = await (0, sql_js_1.default)();
    let rawDb;
    if (fs_1.default.existsSync(dbPath)) {
        const fileBuffer = fs_1.default.readFileSync(dbPath);
        rawDb = new SQL.Database(fileBuffer);
    }
    else {
        rawDb = new SQL.Database();
    }
    dbInstance = new DatabaseCompat(rawDb, dbPath);
    logger.info('Database connected with pure WebAssembly sql.js (zero native compilation)');
    runMigrations(dbInstance);
    return dbInstance;
}
function getDatabase() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbInstance;
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