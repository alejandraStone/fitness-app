/// <reference types="node" />

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { prepareDatabase } from '../migrations';
import type { SqliteDatabase } from '../sqlite-database';
import { NodeSqliteDatabase } from './node-sqlite-database';

/** Opens a prepared in-memory or file-backed SQLite database for tests. */
export async function openTestDatabase(
  filename = ':memory:',
): Promise<SqliteDatabase> {
  const database = new NodeSqliteDatabase(filename);
  await prepareDatabase(database);
  return database;
}

/** Creates a temporary directory that can host a persistent test database. */
export function createTestDatabasePath(): {
  path: string;
  cleanup: () => void;
} {
  const directory = mkdtempSync(join(tmpdir(), 'fitness-app-test-'));
  return {
    path: join(directory, 'fitness-app-test.db'),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}
