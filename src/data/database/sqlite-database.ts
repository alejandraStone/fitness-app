/** Values accepted by the local SQLite adapter. */
export type SqliteParam = string | number | null;

/** Positional parameters for a SQLite statement. */
export type SqliteParams = SqliteParam[];

/** Result of a statement that mutates data. */
export interface SqliteRunResult {
  changes: number;
}

/**
 * Minimal database port used by the Data / Infrastructure layer.
 *
 * The production adapter delegates to `expo-sqlite`; tests use a Node SQLite
 * adapter so migrations, SQL mapping and transactions run against real SQLite
 * without depending on a native module.
 */
export interface SqliteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqliteParams): Promise<SqliteRunResult>;
  getAllAsync<T>(sql: string, params?: SqliteParams): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: SqliteParams): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}
