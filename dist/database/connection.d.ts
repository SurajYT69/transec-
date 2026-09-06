import Database from 'better-sqlite3';
/**
 * Initializes the SQLite database, creating the directory and running migrations if needed.
 * @returns The initialized database instance
 */
export declare function initializeDatabase(): Database.Database;
/**
 * Gets the initialized database instance.
 * @throws Error if the database has not been initialized
 * @returns The database instance
 */
export declare function getDatabase(): Database.Database;
//# sourceMappingURL=connection.d.ts.map