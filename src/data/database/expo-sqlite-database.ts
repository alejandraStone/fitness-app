import * as SQLite from 'expo-sqlite';

import { prepareDatabase } from './migrations';
import type {
  SqliteDatabase,
  SqliteParams,
  SqliteRunResult,
} from './sqlite-database';

/** Production adapter backed by expo-sqlite. */
export class ExpoSqliteDatabase implements SqliteDatabase {
  constructor(private readonly database: SQLite.SQLiteDatabase) {}

  execAsync(sql: string): Promise<void> {
    return this.database.execAsync(sql);
  }

  async runAsync(
    sql: string,
    params: SqliteParams = [],
  ): Promise<SqliteRunResult> {
    const result = await this.database.runAsync(sql, params);
    return { changes: result.changes };
  }

  getAllAsync<T>(sql: string, params: SqliteParams = []): Promise<T[]> {
    return this.database.getAllAsync<T>(sql, params);
  }

  getFirstAsync<T>(sql: string, params: SqliteParams = []): Promise<T | null> {
    return this.database.getFirstAsync<T>(sql, params);
  }

  withTransactionAsync(task: () => Promise<void>): Promise<void> {
    return this.database.withTransactionAsync(task);
  }

  closeAsync(): Promise<void> {
    return this.database.closeAsync();
  }
}

/**
 * Opens the local application database and ensures the schema is ready.
 *
 * Callers should keep one connection for the lifetime of the application and
 * close it only when the application is being torn down.
 */
export async function openAppDatabase(
  databaseName = 'fitness-app.db',
): Promise<SqliteDatabase> {
  const nativeDatabase = await SQLite.openDatabaseAsync(databaseName);
  const database = new ExpoSqliteDatabase(nativeDatabase);

  try {
    await prepareDatabase(database);
    return database;
  } catch (error) {
    try {
      await database.closeAsync();
    } catch {
      // Preserve the original initialization failure.
    }
    throw error;
  }
}
