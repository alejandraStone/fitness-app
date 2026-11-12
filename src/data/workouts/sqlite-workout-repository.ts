import type { DateOnly, RoutineId } from '../../domain/routines';
import {
  DuplicateWorkoutError,
  type PreviousPerformanceCandidateOptions,
  type Workout,
  type WorkoutExercise,
  type WorkoutId,
  type WorkoutRepository,
  type WorkoutSet,
  type WorkoutSummary,
} from '../../domain/workouts';
import type {
  SqliteDatabase,
  SqliteParams,
} from '../database/sqlite-database';

interface WorkoutRow {
  id: string;
  routine_id: string;
  date: string;
  routine_name_snapshot: string;
  saved_at: string | null;
}

interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  name_snapshot: string;
  position: number;
  planned_sets: number;
  planned_reps_min: number;
  planned_reps_max: number;
  planned_weight_kg: number;
  notes_snapshot: string | null;
}

interface WorkoutSetRow {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
}

interface WorkoutSummaryRow extends WorkoutRow {
  exercise_count: number;
  total_sets: number;
  total_reps: number;
}

const WORKOUT_COLUMNS =
  'id, routine_id, date, routine_name_snapshot, saved_at';
const EXERCISE_COLUMNS = `
  id, workout_id, name_snapshot, position, planned_sets,
  planned_reps_min, planned_reps_max, planned_weight_kg, notes_snapshot
`;
const SET_COLUMNS = 'id, workout_exercise_id, set_number, weight_kg, reps';

/** Matches the SQLite unique violation for the workout routine/date index. */
const DUPLICATE_WORKOUT_PATTERN =
  /UNIQUE constraint failed: workouts\.routine_id, workouts\.date/;

/**
 * SQLite implementation of `WorkoutRepository`.
 *
 * Creation persists the workout, its exercises and sets in one transaction.
 * Reads use the historical snapshot columns and never reconstruct data from the
 * current routine configuration. SQLite stays inside the Data layer.
 */
export class SqliteWorkoutRepository implements WorkoutRepository {
  constructor(private readonly database: SqliteDatabase) {}

  async create(workout: Workout): Promise<void> {
    try {
      await this.database.withTransactionAsync(async () => {
        await this.database.runAsync(
          `INSERT INTO workouts (${WORKOUT_COLUMNS}) VALUES (?, ?, ?, ?, ?)`,
          [
            workout.id,
            workout.routineId,
            workout.date,
            workout.routineNameSnapshot,
            workout.savedAt,
          ],
        );

        for (const exercise of orderExercises(workout.exercises)) {
          await this.database.runAsync(
            `INSERT INTO workout_exercises (
              id, workout_id, name_snapshot, position, planned_sets,
              planned_reps_min, planned_reps_max, planned_weight_kg,
              notes_snapshot
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              exercise.id,
              workout.id,
              exercise.nameSnapshot,
              exercise.order,
              exercise.plannedSets,
              exercise.plannedRepsMin,
              exercise.plannedRepsMax,
              exercise.plannedWeightKg,
              exercise.notesSnapshot ?? null,
            ],
          );

          for (const set of orderSets(exercise.sets)) {
            await this.database.runAsync(
              `INSERT INTO sets (${SET_COLUMNS}) VALUES (?, ?, ?, ?, ?)`,
              [
                set.id,
                exercise.id,
                set.setNumber,
                set.weightKg,
                set.reps,
              ],
            );
          }
        }
      });
    } catch (error) {
      if (isDuplicateWorkoutConstraint(error)) {
        throw new DuplicateWorkoutError(workout.routineId, workout.date);
      }
      throw error;
    }
  }

  async findAll(): Promise<Workout[]> {
    const rows = await this.database.getAllAsync<WorkoutRow>(
      `SELECT ${WORKOUT_COLUMNS} FROM workouts
       ORDER BY date DESC, saved_at DESC, id ASC`,
    );

    return this.readWorkouts(rows);
  }

  async findById(id: WorkoutId): Promise<Workout | null> {
    const row = await this.database.getFirstAsync<WorkoutRow>(
      `SELECT ${WORKOUT_COLUMNS} FROM workouts WHERE id = ?`,
      [id],
    );

    return row === null ? null : this.readWorkout(row);
  }

  async findByRoutineAndDate(
    routineId: RoutineId,
    date: DateOnly,
  ): Promise<Workout | null> {
    const row = await this.database.getFirstAsync<WorkoutRow>(
      `SELECT ${WORKOUT_COLUMNS} FROM workouts
       WHERE routine_id = ? AND date = ?`,
      [routineId, date],
    );

    return row === null ? null : this.readWorkout(row);
  }

  async findSummaries(): Promise<WorkoutSummary[]> {
    return this.readSummaries('', []);
  }

  async findSummariesByDateRange(
    startDate: DateOnly,
    endDateExclusive: DateOnly,
  ): Promise<WorkoutSummary[]> {
    return this.readSummaries('WHERE w.date >= ? AND w.date < ?', [
      startDate,
      endDateExclusive,
    ]);
  }

  async findPreviousPerformanceCandidates(
    selectedDate: DateOnly,
    options: PreviousPerformanceCandidateOptions = {},
  ): Promise<Workout[]> {
    const { excludeWorkoutId } = options;
    const rows =
      excludeWorkoutId === undefined
        ? await this.database.getAllAsync<WorkoutRow>(
            `SELECT ${WORKOUT_COLUMNS} FROM workouts
             WHERE date < ?
             ORDER BY date DESC, saved_at DESC, id ASC`,
            [selectedDate],
          )
        : await this.database.getAllAsync<WorkoutRow>(
            `SELECT ${WORKOUT_COLUMNS} FROM workouts
             WHERE date < ? AND id <> ?
             ORDER BY date DESC, saved_at DESC, id ASC`,
            [selectedDate, excludeWorkoutId],
          );

    return this.readWorkouts(rows);
  }

  async updateActualSets(workout: Workout): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      const workoutRow = await this.database.getFirstAsync<{ id: string }>(
        'SELECT id FROM workouts WHERE id = ?',
        [workout.id],
      );

      if (workoutRow === null) {
        throw new Error(`Workout ${workout.id} was not found.`);
      }

      for (const exercise of workout.exercises) {
        const exerciseRow = await this.database.getFirstAsync<{
          workout_id: string;
        }>('SELECT workout_id FROM workout_exercises WHERE id = ?', [
          exercise.id,
        ]);

        if (
          exerciseRow === null ||
          exerciseRow.workout_id !== workout.id
        ) {
          throw new Error(
            `Workout exercise ${exercise.id} does not belong to workout ${workout.id}.`,
          );
        }

        for (const set of exercise.sets) {
          const setRow = await this.database.getFirstAsync<{
            workout_exercise_id: string;
          }>('SELECT workout_exercise_id FROM sets WHERE id = ?', [set.id]);

          if (
            setRow === null ||
            setRow.workout_exercise_id !== exercise.id
          ) {
            throw new Error(
              `Set ${set.id} does not belong to workout exercise ${exercise.id}.`,
            );
          }

          await this.database.runAsync(
            `UPDATE sets SET weight_kg = ?, reps = ?
             WHERE id = ? AND workout_exercise_id = ?`,
            [set.weightKg, set.reps, set.id, exercise.id],
          );
        }
      }
    });
  }

  private async readSummaries(
    whereClause: string,
    params: SqliteParams,
  ): Promise<WorkoutSummary[]> {
    const rows = await this.database.getAllAsync<WorkoutSummaryRow>(
      `SELECT
         w.id,
         w.routine_id,
         w.date,
         w.routine_name_snapshot,
         w.saved_at,
         COUNT(DISTINCT e.id) AS exercise_count,
         COUNT(s.id) AS total_sets,
         COALESCE(SUM(s.reps), 0) AS total_reps
       FROM workouts w
       LEFT JOIN workout_exercises e ON e.workout_id = w.id
       LEFT JOIN sets s ON s.workout_exercise_id = e.id
       ${whereClause}
       GROUP BY
         w.id, w.routine_id, w.date, w.routine_name_snapshot, w.saved_at
       ORDER BY w.date DESC, w.saved_at DESC, w.id ASC`,
      params,
    );

    return rows.map(mapSummaryRow);
  }

  private async readWorkouts(rows: readonly WorkoutRow[]): Promise<Workout[]> {
    const workouts: Workout[] = [];
    for (const row of rows) {
      workouts.push(await this.readWorkout(row));
    }

    return workouts;
  }

  private async readWorkout(row: WorkoutRow): Promise<Workout> {
    const exerciseRows = await this.database.getAllAsync<WorkoutExerciseRow>(
      `SELECT ${EXERCISE_COLUMNS} FROM workout_exercises
       WHERE workout_id = ? ORDER BY position ASC, id ASC`,
      [row.id],
    );
    const setRows = await this.database.getAllAsync<WorkoutSetRow>(
      `SELECT s.id, s.workout_exercise_id, s.set_number, s.weight_kg, s.reps
       FROM sets s
       INNER JOIN workout_exercises e ON e.id = s.workout_exercise_id
       WHERE e.workout_id = ?
       ORDER BY e.position ASC, s.set_number ASC, s.id ASC`,
      [row.id],
    );

    const setsByExercise = new Map<string, WorkoutSet[]>();
    for (const setRow of setRows) {
      const sets = setsByExercise.get(setRow.workout_exercise_id) ?? [];
      sets.push(mapSetRow(setRow));
      setsByExercise.set(setRow.workout_exercise_id, sets);
    }

    return mapWorkoutRow(
      row,
      exerciseRows.map((exerciseRow) =>
        mapExerciseRow(
          exerciseRow,
          setsByExercise.get(exerciseRow.id) ?? [],
        ),
      ),
    );
  }
}

function orderExercises(
  exercises: readonly WorkoutExercise[],
): WorkoutExercise[] {
  return [...exercises].sort(
    (left, right) =>
      left.order - right.order || compareIds(left.id, right.id),
  );
}

function orderSets(sets: readonly WorkoutSet[]): WorkoutSet[] {
  return [...sets].sort(
    (left, right) =>
      left.setNumber - right.setNumber || compareIds(left.id, right.id),
  );
}

function compareIds(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function mapWorkoutRow(
  row: WorkoutRow,
  exercises: WorkoutExercise[],
): Workout {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
    routineNameSnapshot: row.routine_name_snapshot,
    savedAt: requireSavedAt(row.id, row.saved_at),
    exercises,
  };
}

function mapSummaryRow(row: WorkoutSummaryRow): WorkoutSummary {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
    routineNameSnapshot: row.routine_name_snapshot,
    savedAt: requireSavedAt(row.id, row.saved_at),
    exerciseCount: Number(row.exercise_count),
    totalSets: Number(row.total_sets),
    totalReps: Number(row.total_reps),
  };
}

function requireSavedAt(
  workoutId: string,
  savedAt: string | null,
): string {
  if (savedAt === null) {
    throw new Error(`Workout ${workoutId} is missing its saved timestamp.`);
  }

  return savedAt;
}

function mapExerciseRow(
  row: WorkoutExerciseRow,
  sets: WorkoutSet[],
): WorkoutExercise {
  const exercise: WorkoutExercise = {
    id: row.id,
    nameSnapshot: row.name_snapshot,
    order: row.position,
    plannedSets: row.planned_sets,
    plannedRepsMin: row.planned_reps_min,
    plannedRepsMax: row.planned_reps_max,
    plannedWeightKg: row.planned_weight_kg,
    sets,
  };

  if (row.notes_snapshot !== null) {
    exercise.notesSnapshot = row.notes_snapshot;
  }

  return exercise;
}

function mapSetRow(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    setNumber: row.set_number,
    weightKg: row.weight_kg,
    reps: row.reps,
  };
}

function isDuplicateWorkoutConstraint(error: unknown): boolean {
  return DUPLICATE_WORKOUT_PATTERN.test(readErrorMessage(error));
}

function readErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return String(error);
}
