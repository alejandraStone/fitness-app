/// <reference types="node" />

import { DatabaseSync } from 'node:sqlite';

import type {
  SqliteDatabase,
  SqliteParams,
  SqliteRunResult,
} from '../sqlite-database';

/**
 * Test-only SQLite adapter backed by Node's built-in `node:sqlite` module.
 *
 * This is never imported by the application bundle. It allows repository and
 * migration tests to exercise real SQLite, foreign keys and transactions.
 * It requires Node 22.5 or newer, where `node:sqlite` is available.
 */
export class NodeSqliteDatabase implements SqliteDatabase {
  private readonly database: DatabaseSync;

  constructor(filename = ':memory:') {
    this.database = new DatabaseSync(filename);
  }

  async execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  async runAsync(
    sql: string,
    params: SqliteParams = [],
  ): Promise<SqliteRunResult> {
    const result = this.database.prepare(sql).run(...params);
    return { changes: Number(result.changes) };
  }

  async getAllAsync<T>(sql: string, params: SqliteParams = []): Promise<T[]> {
    return this.database.prepare(sql).all(...params) as T[];
  }

  async getFirstAsync<T>(
    sql: string,
    params: SqliteParams = [],
  ): Promise<T | null> {
    const row = this.database.prepare(sql).get(...params);
    return (row as T | undefined) ?? null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.database.exec('BEGIN');
    try {
      await task();
      this.database.exec('COMMIT');
    } catch (error) {
      try {
        this.database.exec('ROLLBACK');
      } catch {
        // Preserve the original failure if the transaction was already aborted.
      }
      throw error;
    }
  }

  async closeAsync(): Promise<void> {
    this.database.close();
  }
}
