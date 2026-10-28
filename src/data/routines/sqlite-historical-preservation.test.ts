/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../../domain/routines';
import type { SqliteDatabase } from '../database/sqlite-database';
import { openTestDatabase } from '../database/testing/test-database';
import { SqliteRoutineRepository } from './sqlite-routine-repository';
import { SqliteSchedulingRepository } from './sqlite-scheduling-repository';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';

function createExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 50,
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1, 3],
    exercises: [createExercise()],
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

function createIdGenerator(): () => string {
  let nextId = 0;
  return () => `schedule-${++nextId}`;
}

async function insertHistoricalWorkout(
  database: SqliteDatabase,
  routine: Routine,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO workouts (
      id, routine_id, date, routine_name_snapshot
    ) VALUES (?, ?, ?, ?)`,
    ['workout-1', routine.id, '2026-10-18', routine.name],
  );
  await database.runAsync(
    `INSERT INTO workout_exercises (
      id, workout_id, name_snapshot, position, planned_sets,
      planned_reps_min, planned_reps_max, planned_weight_kg,
      notes_snapshot
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'workout-exercise-1',
      'workout-1',
      'Back Squat',
      0,
      3,
      8,
      10,
      50,
      'Original notes',
    ],
  );
  await database.runAsync(
    `INSERT INTO sets (
      id, workout_exercise_id, set_number, weight_kg, reps
    ) VALUES (?, ?, ?, ?, ?)`,
    ['set-1', 'workout-exercise-1', 1, 52.5, 8],
  );
}

async function readHistoricalWorkout(
  database: SqliteDatabase,
): Promise<{
  workout: {
    id: string;
    routine_id: string;
    date: string;
    routine_name_snapshot: string;
  } | null;
  exercise: {
    id: string;
    workout_id: string;
    name_snapshot: string;
    position: number;
    planned_sets: number;
    planned_reps_min: number;
    planned_reps_max: number;
    planned_weight_kg: number;
    notes_snapshot: string | null;
  } | null;
  set: {
    id: string;
    workout_exercise_id: string;
    set_number: number;
    weight_kg: number;
    reps: number;
  } | null;
}> {
  return {
    workout: await database.getFirstAsync(
      `SELECT id, routine_id, date, routine_name_snapshot
       FROM workouts WHERE id = ?`,
      ['workout-1'],
    ),
    exercise: await database.getFirstAsync(
      `SELECT id, workout_id, name_snapshot, position, planned_sets,
        planned_reps_min, planned_reps_max, planned_weight_kg,
        notes_snapshot
       FROM workout_exercises WHERE id = ?`,
      ['workout-exercise-1'],
    ),
    set: await database.getFirstAsync(
      `SELECT id, workout_exercise_id, set_number, weight_kg, reps
       FROM sets WHERE id = ?`,
      ['set-1'],
    ),
  };
}

describe('historical workout preservation', () => {
  let database: SqliteDatabase;
  let repository: SqliteRoutineRepository;
  let schedulingRepository: SqliteSchedulingRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    repository = new SqliteRoutineRepository({
      database,
      generateId: createIdGenerator(),
    });
    schedulingRepository = new SqliteSchedulingRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('does not rewrite workout snapshots when a routine is edited', async () => {
    const routine = createRoutine();
    await repository.create(routine);
    await insertHistoricalWorkout(database, routine);
    const historyBefore = await readHistoricalWorkout(database);

    const edited = createRoutine({
      name: 'Lower B',
      weekdays: [2],
      exercises: [
        createExercise({
          id: 'exercise-replacement',
          name: 'Front Squat',
          targetWeightKg: 40,
        }),
      ],
      updatedAt: UPDATED,
    });
    await repository.update(edited);

    await expect(readHistoricalWorkout(database)).resolves.toEqual(
      historyBefore,
    );

    const currentRoutine = await repository.findById(routine.id);
    expect(currentRoutine?.name).toBe('Lower B');
    expect(currentRoutine?.exercises[0]?.name).toBe('Front Squat');
  });

  it('does not delete workout history when a routine is deleted', async () => {
    const routine = createRoutine();
    await repository.create(routine);
    await schedulingRepository.createAssignment({
      id: 'assignment-1',
      routineId: routine.id,
      date: '2026-10-19',
    });
    await insertHistoricalWorkout(database, routine);
    const historyBefore = await readHistoricalWorkout(database);

    await expect(repository.delete(routine.id)).resolves.toBe(true);

    await expect(readHistoricalWorkout(database)).resolves.toEqual(
      historyBefore,
    );
    await expect(repository.findById(routine.id)).resolves.toBeNull();
    await expect(
      schedulingRepository.findAssignment(routine.id, '2026-10-19'),
    ).resolves.toBeNull();

    const historyCounts = await database.getFirstAsync<{
      workouts: number;
      exercises: number;
      sets: number;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM workouts) AS workouts,
        (SELECT COUNT(*) FROM workout_exercises) AS exercises,
        (SELECT COUNT(*) FROM sets) AS sets`,
    );
    expect(historyCounts).toEqual({
      workouts: 1,
      exercises: 1,
      sets: 1,
    });
  });
});
