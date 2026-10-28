import type {
  CreateRoutineOptions,
  IsoWeekday,
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import type { SqliteDatabase } from '../database/sqlite-database';

interface RoutineRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface RoutineExerciseRow {
  id: string;
  routine_id: string;
  name: string;
  position: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_weight_kg: number;
  notes: string | null;
}

interface RoutineWeekdayRow {
  routine_id: string;
  day_of_week: number;
}

interface RoutineScheduleRow {
  id: string;
  day_of_week: number;
}

const ROUTINE_COLUMNS = 'id, name, created_at, updated_at';
const EXERCISE_COLUMNS = `
  id, routine_id, name, position, target_sets,
  target_reps_min, target_reps_max, target_weight_kg, notes
`;

/** Dependencies required by the SQLite routine repository. */
export interface SqliteRoutineRepositoryOptions {
  database: SqliteDatabase;
  /** Generates identifiers for recurring weekday schedule rows. */
  generateId: () => string;
}

/**
 * SQLite implementation of `RoutineRepository`.
 *
 * Every multi-record write runs in a transaction. Historical workouts are not
 * referenced by this repository and are never modified or deleted here.
 */
export class SqliteRoutineRepository implements RoutineRepository {
  private readonly database: SqliteDatabase;
  private readonly generateId: () => string;

  constructor({ database, generateId }: SqliteRoutineRepositoryOptions) {
    this.database = database;
    this.generateId = generateId;
  }

  async create(
    routine: Routine,
    options: CreateRoutineOptions = {},
  ): Promise<void> {
    const assignment = options.dateAssignment;
    if (assignment !== undefined && assignment.routineId !== routine.id) {
      throw new Error('Date assignment must belong to the routine.');
    }

    await this.database.withTransactionAsync(async () => {
      await this.database.runAsync(
        `INSERT INTO routines (${ROUTINE_COLUMNS}) VALUES (?, ?, ?, ?)`,
        [routine.id, routine.name, routine.createdAt, routine.updatedAt],
      );
      await this.insertExercises(routine);
      await this.insertWeekdays(routine.id, routine.weekdays);

      if (assignment !== undefined) {
        await this.database.runAsync(
          `INSERT INTO routine_assignments (id, routine_id, date)
           VALUES (?, ?, ?)`,
          [assignment.id, assignment.routineId, assignment.date],
        );
      }
    });
  }

  async findAll(): Promise<Routine[]> {
    const routineRows = await this.database.getAllAsync<RoutineRow>(
      `SELECT ${ROUTINE_COLUMNS} FROM routines
       ORDER BY created_at ASC, id ASC`,
    );

    if (routineRows.length === 0) {
      return [];
    }

    const exerciseRows = await this.database.getAllAsync<RoutineExerciseRow>(
      `SELECT ${EXERCISE_COLUMNS} FROM routine_exercises
       ORDER BY routine_id ASC, position ASC, id ASC`,
    );
    const weekdayRows = await this.database.getAllAsync<RoutineWeekdayRow>(
      `SELECT routine_id, day_of_week FROM routine_schedules
       ORDER BY routine_id ASC, day_of_week ASC`,
    );

    const exercisesByRoutine = new Map<RoutineId, RoutineExercise[]>();
    for (const row of exerciseRows) {
      const exercises = exercisesByRoutine.get(row.routine_id) ?? [];
      exercises.push(mapExerciseRow(row));
      exercisesByRoutine.set(row.routine_id, exercises);
    }

    const weekdaysByRoutine = new Map<RoutineId, IsoWeekday[]>();
    for (const row of weekdayRows) {
      const weekdays = weekdaysByRoutine.get(row.routine_id) ?? [];
      weekdays.push(row.day_of_week as IsoWeekday);
      weekdaysByRoutine.set(row.routine_id, weekdays);
    }

    return routineRows.map((row) =>
      mapRoutineRow(
        row,
        exercisesByRoutine.get(row.id) ?? [],
        weekdaysByRoutine.get(row.id) ?? [],
      ),
    );
  }

  async findById(id: RoutineId): Promise<Routine | null> {
    const routineRow = await this.database.getFirstAsync<RoutineRow>(
      `SELECT ${ROUTINE_COLUMNS} FROM routines WHERE id = ?`,
      [id],
    );

    if (routineRow === null) {
      return null;
    }

    const exerciseRows = await this.database.getAllAsync<RoutineExerciseRow>(
      `SELECT ${EXERCISE_COLUMNS} FROM routine_exercises
       WHERE routine_id = ? ORDER BY position ASC, id ASC`,
      [id],
    );
    const weekdayRows = await this.database.getAllAsync<{ day_of_week: number }>(
      `SELECT day_of_week FROM routine_schedules
       WHERE routine_id = ? ORDER BY day_of_week ASC`,
      [id],
    );

    return mapRoutineRow(
      routineRow,
      exerciseRows.map(mapExerciseRow),
      weekdayRows.map((row) => row.day_of_week as IsoWeekday),
    );
  }

  async update(routine: Routine): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      const result = await this.database.runAsync(
        'UPDATE routines SET name = ?, updated_at = ? WHERE id = ?',
        [routine.name, routine.updatedAt, routine.id],
      );

      if (result.changes === 0) {
        throw new Error(`Routine ${routine.id} was not found.`);
      }

      await this.database.runAsync(
        'DELETE FROM routine_exercises WHERE routine_id = ?',
        [routine.id],
      );
      await this.insertExercises(routine);
      await this.replaceWeekdays(routine.id, routine.weekdays);
    });
  }

  async delete(id: RoutineId): Promise<boolean> {
    let deleted = false;

    await this.database.withTransactionAsync(async () => {
      const result = await this.database.runAsync(
        'DELETE FROM routines WHERE id = ?',
        [id],
      );
      deleted = result.changes > 0;
    });

    return deleted;
  }

  private async insertExercises(routine: Routine): Promise<void> {
    for (const exercise of routine.exercises) {
      await this.database.runAsync(
        `INSERT INTO routine_exercises (
          id, routine_id, name, position, target_sets,
          target_reps_min, target_reps_max, target_weight_kg, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exercise.id,
          routine.id,
          exercise.name,
          exercise.order,
          exercise.targetSets,
          exercise.targetRepsMin,
          exercise.targetRepsMax,
          exercise.targetWeightKg,
          exercise.notes ?? null,
        ],
      );
    }
  }

  private async insertWeekdays(
    routineId: RoutineId,
    weekdays: IsoWeekday[],
  ): Promise<void> {
    for (const weekday of normalizeWeekdays(weekdays)) {
      await this.database.runAsync(
        `INSERT INTO routine_schedules (id, routine_id, day_of_week)
         VALUES (?, ?, ?)`,
        [this.generateId(), routineId, weekday],
      );
    }
  }

  private async replaceWeekdays(
    routineId: RoutineId,
    weekdays: IsoWeekday[],
  ): Promise<void> {
    const existingRows = await this.database.getAllAsync<RoutineScheduleRow>(
      'SELECT id, day_of_week FROM routine_schedules WHERE routine_id = ?',
      [routineId],
    );
    const desiredWeekdays = normalizeWeekdays(weekdays);
    const desiredSet = new Set<number>(desiredWeekdays);
    const existingByWeekday = new Map(
      existingRows.map((row) => [row.day_of_week, row.id]),
    );

    for (const row of existingRows) {
      if (!desiredSet.has(row.day_of_week)) {
        await this.database.runAsync(
          'DELETE FROM routine_schedules WHERE id = ?',
          [row.id],
        );
      }
    }

    for (const weekday of desiredWeekdays) {
      if (!existingByWeekday.has(weekday)) {
        await this.database.runAsync(
          `INSERT INTO routine_schedules (id, routine_id, day_of_week)
           VALUES (?, ?, ?)`,
          [this.generateId(), routineId, weekday],
        );
      }
    }
  }
}

function normalizeWeekdays(weekdays: IsoWeekday[]): IsoWeekday[] {
  return Array.from(new Set(weekdays)).sort((left, right) => left - right);
}

function mapRoutineRow(
  row: RoutineRow,
  exercises: RoutineExercise[],
  weekdays: IsoWeekday[],
): Routine {
  return {
    id: row.id,
    name: row.name,
    weekdays,
    exercises,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExerciseRow(row: RoutineExerciseRow): RoutineExercise {
  const exercise: RoutineExercise = {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    order: row.position,
    targetSets: row.target_sets,
    targetRepsMin: row.target_reps_min,
    targetRepsMax: row.target_reps_max,
    targetWeightKg: row.target_weight_kg,
  };

  if (row.notes !== null) {
    exercise.notes = row.notes;
  }

  return exercise;
}
