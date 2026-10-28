import type { SqliteDatabase } from './sqlite-database';

/** One versioned, forward-only schema migration. */
export interface Migration {
  version: number;
  name: string;
  up: string;
}

/**
 * Migrations are append-only. Never edit a released migration; add a new
 * version instead so existing installations keep their data.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'initial_routines_and_workout_schema',
    up: `
      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS routine_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        routine_id TEXT NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        description TEXT,
        position INTEGER NOT NULL CHECK (position >= 0),
        target_sets INTEGER NOT NULL CHECK (target_sets > 0),
        target_reps_min INTEGER NOT NULL CHECK (target_reps_min > 0),
        target_reps_max INTEGER NOT NULL CHECK (target_reps_max >= target_reps_min),
        target_weight_kg REAL NOT NULL DEFAULT 0 CHECK (target_weight_kg >= 0),
        notes TEXT,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
        UNIQUE (routine_id, position)
      );

      CREATE TABLE IF NOT EXISTS routine_schedules (
        id TEXT PRIMARY KEY NOT NULL,
        routine_id TEXT NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
        UNIQUE (routine_id, day_of_week)
      );

      CREATE TABLE IF NOT EXISTS routine_assignments (
        id TEXT PRIMARY KEY NOT NULL,
        routine_id TEXT NOT NULL,
        date TEXT NOT NULL CHECK (
          date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        ),
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
        UNIQUE (routine_id, date)
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY NOT NULL,
        routine_id TEXT NOT NULL,
        date TEXT NOT NULL CHECK (
          date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        ),
        routine_name_snapshot TEXT NOT NULL CHECK (
          length(trim(routine_name_snapshot)) > 0
        )
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        workout_id TEXT NOT NULL,
        name_snapshot TEXT NOT NULL CHECK (length(trim(name_snapshot)) > 0),
        position INTEGER NOT NULL CHECK (position >= 0),
        planned_sets INTEGER NOT NULL CHECK (planned_sets > 0),
        planned_reps_min INTEGER NOT NULL CHECK (planned_reps_min > 0),
        planned_reps_max INTEGER NOT NULL CHECK (
          planned_reps_max >= planned_reps_min
        ),
        planned_weight_kg REAL NOT NULL CHECK (planned_weight_kg >= 0),
        description_snapshot TEXT,
        notes_snapshot TEXT,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
        UNIQUE (workout_id, position)
      );

      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY NOT NULL,
        workout_exercise_id TEXT NOT NULL,
        set_number INTEGER NOT NULL CHECK (set_number > 0),
        weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
        reps INTEGER NOT NULL CHECK (reps > 0),
        FOREIGN KEY (workout_exercise_id)
          REFERENCES workout_exercises(id) ON DELETE CASCADE,
        UNIQUE (workout_exercise_id, set_number)
      );

      CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id
        ON routine_exercises (routine_id);
      CREATE INDEX IF NOT EXISTS idx_routine_schedules_routine_id
        ON routine_schedules (routine_id);
      CREATE INDEX IF NOT EXISTS idx_routine_assignments_date
        ON routine_assignments (date);
      CREATE INDEX IF NOT EXISTS idx_workouts_routine_id
        ON workouts (routine_id);
      CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id
        ON workout_exercises (workout_id);
      CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise_id
        ON sets (workout_exercise_id);
    `,
  },
  {
    version: 2,
    name: 'merge_exercise_description_into_notes',
    up: `
      UPDATE routine_exercises
      SET notes = description
      WHERE (notes IS NULL OR trim(notes) = '')
        AND description IS NOT NULL
        AND trim(description) <> '';

      UPDATE routine_exercises
      SET notes = notes || char(10) || char(10) || description
      WHERE notes IS NOT NULL
        AND trim(notes) <> ''
        AND description IS NOT NULL
        AND trim(description) <> ''
        AND trim(notes) <> trim(description);

      ALTER TABLE routine_exercises DROP COLUMN description;

      UPDATE workout_exercises
      SET notes_snapshot = description_snapshot
      WHERE (notes_snapshot IS NULL OR trim(notes_snapshot) = '')
        AND description_snapshot IS NOT NULL
        AND trim(description_snapshot) <> '';

      UPDATE workout_exercises
      SET notes_snapshot =
        notes_snapshot || char(10) || char(10) || description_snapshot
      WHERE notes_snapshot IS NOT NULL
        AND trim(notes_snapshot) <> ''
        AND description_snapshot IS NOT NULL
        AND trim(description_snapshot) <> ''
        AND trim(notes_snapshot) <> trim(description_snapshot);

      ALTER TABLE workout_exercises DROP COLUMN description_snapshot;
    `,
  },
];

/**
 * Applies pending migrations. Each migration commits atomically together with
 * its `PRAGMA user_version` marker, so a failed migration leaves the database
 * at its previous version.
 */
export async function migrateDatabase(database: SqliteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let currentVersion = versionRow?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.up);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    });

    currentVersion = migration.version;
  }
}

/** Configures connection pragmas and applies all pending migrations. */
export async function prepareDatabase(database: SqliteDatabase): Promise<void> {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await migrateDatabase(database);
}
