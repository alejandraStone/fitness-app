/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../../domain/routines';
import type { WorkoutRecordingContext } from '../../domain/workouts';
import type { SqliteDatabase } from '../../data/database/sqlite-database';
import { openTestDatabase } from '../../data/database/testing/test-database';
import { SqliteRoutineRepository } from '../../data/routines/sqlite-routine-repository';
import { SqliteSchedulingRepository } from '../../data/routines/sqlite-scheduling-repository';
import { SqliteWorkoutRepository } from '../../data/workouts/sqlite-workout-repository';
import { prepareWorkoutRecording } from './prepare-workout-recording';
import { saveWorkout } from './save-workout';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';
const WORKOUT_DATE = '2026-11-02';
const SAVED_AT = '2026-11-02T18:00:00.000Z';

function createRoutineExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'routine-exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 2,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 75,
    notes: 'Brace before descending.',
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1],
    exercises: [
      createRoutineExercise(),
      createRoutineExercise({
        id: 'routine-exercise-2',
        name: 'Leg Curl',
        order: 1,
        targetSets: 1,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetWeightKg: 30,
        notes: 'Slow eccentric.',
      }),
    ],
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

function validActuals(): unknown[] {
  return [
    {
      sets: [
        { weightKg: 80, reps: 8 },
        { weightKg: 82.5, reps: 7 },
      ],
    },
    {
      sets: [{ weightKg: 32, reps: 12 }],
    },
  ];
}

function createIdGenerator(prefix: string): () => string {
  let nextId = 0;
  return () => `${prefix}-${++nextId}`;
}

async function readWorkoutCounts(
  database: SqliteDatabase,
): Promise<{ workouts: number; exercises: number; sets: number }> {
  const counts = await database.getFirstAsync<{
    workouts: number;
    exercises: number;
    sets: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM workouts) AS workouts,
       (SELECT COUNT(*) FROM workout_exercises) AS exercises,
       (SELECT COUNT(*) FROM sets) AS sets`,
  );

  if (counts === null) {
    throw new Error('Expected workout counts.');
  }

  return counts;
}

describe('save workout integration', () => {
  let database: SqliteDatabase;
  let routineRepository: SqliteRoutineRepository;
  let schedulingRepository: SqliteSchedulingRepository;
  let workoutRepository: SqliteWorkoutRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    routineRepository = new SqliteRoutineRepository({
      database,
      generateId: createIdGenerator('schedule'),
    });
    schedulingRepository = new SqliteSchedulingRepository(database);
    workoutRepository = new SqliteWorkoutRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  async function prepareContext(routine: Routine): Promise<WorkoutRecordingContext> {
    const result = await prepareWorkoutRecording(
      { routineId: routine.id, date: WORKOUT_DATE },
      {
        routineRepository,
        schedulingRepository,
        workoutRepository,
        today: () => WORKOUT_DATE,
      },
    );

    if (!result.ok || result.mode !== 'record') {
      throw new Error('Expected a recording context.');
    }

    return result.context;
  }

  function createSaveDependencies(prefix = 'workout') {
    return {
      routineRepository,
      workoutRepository,
      generateId: createIdGenerator(prefix),
      now: () => SAVED_AT,
    };
  }

  it('saves a complete workout and reads it back from SQLite', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const context = await prepareContext(routine);

    const result = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.workout).toMatchObject({
      routineId: routine.id,
      date: WORKOUT_DATE,
      routineNameSnapshot: 'Lower A',
      savedAt: SAVED_AT,
    });
    expect(result.workout.exercises.map((exercise) => exercise.nameSnapshot)).toEqual([
      'Back Squat',
      'Leg Curl',
    ]);
    await expect(workoutRepository.findById(result.workout.id)).resolves.toEqual(
      result.workout,
    );
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 1,
      exercises: 2,
      sets: 3,
    });
  });

  it('rejects a duplicate routine/date and keeps only the first workout', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const context = await prepareContext(routine);
    const first = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies('first'),
    );

    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    const duplicate = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies('duplicate'),
    );

    expect(duplicate).toEqual({
      ok: false,
      reason: 'duplicate',
      errors: [
        {
          field: 'date',
          code: 'workout.duplicate',
          message:
            'Ya existe un entrenamiento guardado para esta rutina y fecha.',
        },
      ],
    });
    await expect(workoutRepository.findById(first.workout.id)).resolves.toEqual(
      first.workout,
    );
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 1,
      exercises: 2,
      sets: 3,
    });
  });

  it('cancels without persisting when the source routine was deleted', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const context = await prepareContext(routine);
    await expect(routineRepository.delete(routine.id)).resolves.toBe(true);

    const result = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies(),
    );

    expect(result).toEqual({
      ok: false,
      reason: 'routineDeleted',
      errors: [
        {
          field: 'routineId',
          code: 'workout.routine.deleted',
          message:
            'La rutina se eliminó mientras registrabas el entrenamiento. El registro se canceló.',
        },
      ],
    });
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 0,
      exercises: 0,
      sets: 0,
    });
  });

  it('preserves the captured snapshot when the routine is edited before saving', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const context = await prepareContext(routine);
    const edited: Routine = {
      ...routine,
      name: 'Upper B',
      weekdays: [3],
      exercises: [
        createRoutineExercise({
          id: 'routine-exercise-edited',
          name: 'Bench Press',
          order: 0,
          targetSets: 3,
          targetRepsMin: 5,
          targetRepsMax: 6,
          targetWeightKg: 60,
          notes: 'Edited note.',
        }),
      ],
      updatedAt: UPDATED,
    };
    await routineRepository.update(edited);

    const result = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.workout.routineNameSnapshot).toBe('Lower A');
    expect(
      result.workout.exercises.map((exercise) => ({
        name: exercise.nameSnapshot,
        plannedSets: exercise.plannedSets,
        plannedRepsMin: exercise.plannedRepsMin,
        plannedRepsMax: exercise.plannedRepsMax,
        plannedWeightKg: exercise.plannedWeightKg,
        notes: exercise.notesSnapshot,
      })),
    ).toEqual([
      {
        name: 'Back Squat',
        plannedSets: 2,
        plannedRepsMin: 8,
        plannedRepsMax: 10,
        plannedWeightKg: 75,
        notes: 'Brace before descending.',
      },
      {
        name: 'Leg Curl',
        plannedSets: 1,
        plannedRepsMin: 10,
        plannedRepsMax: 12,
        plannedWeightKg: 30,
        notes: 'Slow eccentric.',
      },
    ]);
    await expect(workoutRepository.findById(result.workout.id)).resolves.toEqual(
      result.workout,
    );
    await expect(routineRepository.findById(routine.id)).resolves.toEqual(
      edited,
    );
  });

  it('rolls back every row and allows a retry when saving a child set fails', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const context = await prepareContext(routine);
    await database.execAsync(`
      CREATE TRIGGER fail_set_insert
      BEFORE INSERT ON sets
      BEGIN
        SELECT RAISE(ABORT, 'forced set insert failure');
      END;
    `);

    const failed = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies('failed'),
    );

    expect(failed).toEqual({
      ok: false,
      reason: 'persistence',
      errors: [
        {
          field: 'workout',
          code: 'workout.save.failed',
          message: 'No se pudo guardar el entrenamiento. Inténtalo de nuevo.',
        },
      ],
    });
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 0,
      exercises: 0,
      sets: 0,
    });

    await database.execAsync('DROP TRIGGER fail_set_insert;');

    const retried = await saveWorkout(
      { context, actuals: validActuals() },
      createSaveDependencies('retried'),
    );

    expect(retried.ok).toBe(true);
    if (!retried.ok) {
      return;
    }

    await expect(
      workoutRepository.findById(retried.workout.id),
    ).resolves.toEqual(retried.workout);
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 1,
      exercises: 2,
      sets: 3,
    });
  });
});
