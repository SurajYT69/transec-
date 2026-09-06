import { Database as SqlJsDatabase } from 'sql.js';
export interface StatementCompat {
    run(...params: any[]): {
        changes: number;
        lastInsertRowid: number;
    };
    get(...params: any[]): any | undefined;
}
export declare class DatabaseCompat {
    private db;
    private filePath;
    constructor(db: SqlJsDatabase, filePath: string);
    exec(sql: string): void;
    prepare(sql: string): StatementCompat;
    private persist;
}
/**
 * Initializes the pure JavaScript SQLite database (sql.js / WebAssembly).
 * Does not require any native C++ node-gyp compilation or prebuild binaries.
 */
export declare function initializeDatabase(): Promise<DatabaseCompat>;
export declare function getDatabase(): DatabaseCompat;
//# sourceMappingURL=connection.d.ts.map