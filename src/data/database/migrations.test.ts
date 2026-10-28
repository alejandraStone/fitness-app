/** @jest-environment node */

import { describe, expect, it } from '@jest/globals';

import { MIGRATIONS, migrateDatabase } from './migrations';
import { NodeSqliteDatabase } from './testing/node-sqlite-database';
import { openTestDatabase } from './testing/test-database';

const EXPECTED_TABLES = [
  'routine_assignments',
  'routine_exercises',
  'routine_schedules',
  'routines',
  'sets',
  'workout_exercises',
  'workouts',
];

const EXPECTED_INDEXES = [
  'idx_routine_assignments_date',
  'idx_routine_exercises_routine_id',
  'idx_routine_schedules_routine_id',
  'idx_sets_workout_exercise_id',
  'idx_workout_exercises_workout_id',
  'idx_workouts_routine_id',
];

describe('database migrations', () => {
  it('creates the complete schema in a new local database', async () => {
    const database = await openTestDatabase();

    try {
      const tables = await database.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      );
      expect(tables.map((table) => table.name)).toEqual(EXPECTED_TABLES);

      const indexes = await database.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'index' AND name LIKE 'idx_%'
         ORDER BY name`,
      );
      expect(indexes.map((index) => index.name)).toEqual(EXPECTED_INDEXES);

      const version = await database.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version',
      );
      expect(version?.user_version).toBe(
        MIGRATIONS[MIGRATIONS.length - 1].version,
      );

      const foreignKeys = await database.getFirstAsync<{
        foreign_keys: number;
      }>('PRAGMA foreign_keys');
      expect(foreignKeys?.foreign_keys).toBe(1);
    } finally {
      await database.closeAsync();
    }
  });

  it('is idempotent when migrations run again', async () => {
    const database = await openTestDatabase();

    try {
      await migrateDatabase(database);

      const tables = await database.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      );
      expect(tables.map((table) => table.name)).toEqual(EXPECTED_TABLES);

      const version = await database.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version',
      );
      expect(version?.user_version).toBe(
        MIGRATIONS[MIGRATIONS.length - 1].version,
      );
    } finally {
      await database.closeAsync();
    }
  });

  it('keeps workout history independent from routines', async () => {
    const database = await openTestDatabase();

    try {
      const workoutForeignKeys = await database.getAllAsync<
        Record<string, unknown>
      >("PRAGMA foreign_key_list('workouts')");
      expect(workoutForeignKeys).toEqual([]);

      const workoutExerciseForeignKeys = await database.getAllAsync<
        Record<string, unknown>
      >("PRAGMA foreign_key_list('workout_exercises')");
      expect(workoutExerciseForeignKeys).toHaveLength(1);
      expect(workoutExerciseForeignKeys[0]).toMatchObject({
        table: 'workouts',
        from: 'workout_id',
        to: 'id',
        on_delete: 'CASCADE',
      });
    } finally {
      await database.closeAsync();
    }
  });

  it('merges exercise descriptions into notes when upgrading from version 1', async () => {
    const database = new NodeSqliteDatabase(':memory:');

    try {
      await database.execAsync('PRAGMA foreign_keys = ON;');
      await database.execAsync(MIGRATIONS[0].up);
      await database.execAsync('PRAGMA user_version = 1;');
      await database.runAsync(
        `INSERT INTO routines (id, name, created_at, updated_at)
         VALUES ('routine-1', 'Lower A',
           '2026-10-18T08:00:00.000Z', '2026-10-18T08:00:00.000Z')`,
      );
      await database.runAsync(
        `INSERT INTO routine_exercises (
           id, routine_id, name, description, position, target_sets,
           target_reps_min, target_reps_max, target_weight_kg, notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'exercise-1',
          'routine-1',
          'Back Squat',
          'Wide stance',
          0,
          3,
          8,
          10,
          50,
          null,
        ],
      );
      await database.runAsync(
        `INSERT INTO routine_exercises (
           id, routine_id, name, description, position, target_sets,
           target_reps_min, target_reps_max, target_weight_kg, notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'exercise-2',
          'routine-1',
          'Leg Press',
          'Machine',
          1,
          3,
          10,
          12,
          60,
          'Slow eccentric',
        ],
      );
      await database.runAsync(
        `INSERT INTO workouts (id, routine_id, date, routine_name_snapshot)
         VALUES ('workout-1', 'routine-1', '2026-10-18', 'Lower A')`,
      );
      await database.runAsync(
        `INSERT INTO workout_exercises (
           id, workout_id, name_snapshot, position, planned_sets,
           planned_reps_min, planned_reps_max, planned_weight_kg,
           description_snapshot, notes_snapshot
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'workout-exercise-1',
          'workout-1',
          'Back Squat',
          0,
          3,
          8,
          10,
          50,
          'Original description',
          null,
        ],
      );

      await migrateDatabase(database);

      const version = await database.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version',
      );
      expect(version?.user_version).toBe(2);

      const exercises = await database.getAllAsync<{
        id: string;
        notes: string | null;
      }>('SELECT id, notes FROM routine_exercises ORDER BY position');
      expect(exercises).toEqual([
        { id: 'exercise-1', notes: 'Wide stance' },
        { id: 'exercise-2', notes: 'Slow eccentric\n\nMachine' },
      ]);

      const workoutExercise = await database.getFirstAsync<{
        notes_snapshot: string | null;
      }>('SELECT notes_snapshot FROM workout_exercises WHERE id = ?', [
        'workout-exercise-1',
      ]);
      expect(workoutExercise?.notes_snapshot).toBe('Original description');

      const routineExerciseColumns = await database.getAllAsync<{
        name: string;
      }>("SELECT name FROM pragma_table_info('routine_exercises')");
      expect(routineExerciseColumns.map((column) => column.name)).not.toContain(
        'description',
      );

      const workoutExerciseColumns = await database.getAllAsync<{
        name: string;
      }>("SELECT name FROM pragma_table_info('workout_exercises')");
      expect(
        workoutExerciseColumns.map((column) => column.name),
      ).not.toContain('description_snapshot');
    } finally {
      await database.closeAsync();
    }
  });
});
