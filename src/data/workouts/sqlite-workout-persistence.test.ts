/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { Routine, RoutineExercise } from '../../domain/routines';
import {
  DuplicateWorkoutError,
  summarizeWorkout,
  type Workout,
} from '../../domain/workouts';
import type { SqliteDatabase } from '../database/sqlite-database';
import {
  createTestDatabasePath,
  openTestDatabase,
} from '../database/testing/test-database';
import { SqliteRoutineRepository } from '../routines/sqlite-routine-repository';
import { SqliteWorkoutRepository } from './sqlite-workout-repository';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-19T12:00:00.000Z';
const SAVED_AT = '2026-11-02T18:00:00.000Z';

function createRoutineExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'exercise-1',
    routineId: 'routine-1',
    name: 'Back Squat',
    order: 0,
    targetSets: 2,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 50,
    notes: 'Brace before descending.',
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1, 4],
    exercises: [
      createRoutineExercise(),
      createRoutineExercise({
        id: 'exercise-2',
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

function createWorkoutFromRoutine(
  routine: Routine,
  workoutId = 'workout-1',
): Workout {
  return {
    id: workoutId,
    routineId: routine.id,
    date: '2026-11-02',
    routineNameSnapshot: routine.name,
    savedAt: SAVED_AT,
    exercises: routine.exercises.map((exercise) => ({
      id: `workout-exercise-${workoutId}-${exercise.id}`,
      nameSnapshot: exercise.name,
      order: exercise.order,
      plannedSets: exercise.targetSets,
      plannedRepsMin: exercise.targetRepsMin,
      plannedRepsMax: exercise.targetRepsMax,
      plannedWeightKg: exercise.targetWeightKg,
      ...(exercise.notes === undefined
        ? {}
        : { notesSnapshot: exercise.notes }),
      sets: Array.from({ length: exercise.targetSets }, (_, index) => ({
        id: `workout-set-${workoutId}-${exercise.id}-${index + 1}`,
        setNumber: index + 1,
        weightKg: exercise.targetWeightKg,
        reps: exercise.targetRepsMin,
      })),
    })),
  };
}

function createIdGenerator(): () => string {
  let nextId = 0;
  return () => `schedule-${++nextId}`;
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

describe('workout persistence integration', () => {
  let database: SqliteDatabase;
  let routineRepository: SqliteRoutineRepository;
  let workoutRepository: SqliteWorkoutRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    routineRepository = new SqliteRoutineRepository({
      database,
      generateId: createIdGenerator(),
    });
    workoutRepository = new SqliteWorkoutRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('rolls back a workout when a child set cannot be persisted', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const workout = createWorkoutFromRoutine(routine);
    const firstExercise = workout.exercises[0];
    const invalidWorkout: Workout = {
      ...workout,
      exercises: [
        {
          ...firstExercise,
          sets: [
            firstExercise.sets[0],
            { ...firstExercise.sets[1], reps: 0 },
          ],
        },
      ],
    };

    await expect(workoutRepository.create(invalidWorkout)).rejects.toThrow(
      /CHECK constraint failed/,
    );

    await expect(workoutRepository.findById(workout.id)).resolves.toBeNull();
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 0,
      exercises: 0,
      sets: 0,
    });
  });

  it('rejects a duplicate routine/date and keeps the existing workout intact', async () => {
    const routine = createRoutine({
      exercises: [createRoutineExercise({ targetSets: 1 })],
    });
    await routineRepository.create(routine);
    const first = createWorkoutFromRoutine(routine);
    await workoutRepository.create(first);
    const duplicate = createWorkoutFromRoutine(routine, 'workout-2');

    await expect(workoutRepository.create(duplicate)).rejects.toBeInstanceOf(
      DuplicateWorkoutError,
    );

    await expect(workoutRepository.findById(first.id)).resolves.toEqual(first);
    await expect(workoutRepository.findById(duplicate.id)).resolves.toBeNull();
    await expect(workoutRepository.findSummaries()).resolves.toEqual([
      summarizeWorkout(first),
    ]);
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 1,
      exercises: 1,
      sets: 1,
    });
  });

  it('reads ordered snapshots and preserves them when the routine is edited', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const expected = createWorkoutFromRoutine(routine);
    const unorderedWorkout: Workout = {
      ...expected,
      exercises: [...expected.exercises]
        .reverse()
        .map((exercise) => ({
          ...exercise,
          sets: [...exercise.sets].reverse(),
        })),
    };

    await workoutRepository.create(unorderedWorkout);

    await expect(workoutRepository.findById(expected.id)).resolves.toEqual(
      expected,
    );

    const edited = createRoutine({
      name: 'Lower B',
      weekdays: [2],
      exercises: [
        createRoutineExercise({
          id: 'exercise-replacement',
          name: 'Front Squat',
          targetSets: 3,
          targetRepsMin: 5,
          targetRepsMax: 6,
          targetWeightKg: 40,
          notes: 'New note.',
        }),
      ],
      updatedAt: UPDATED,
    });
    await routineRepository.update(edited);

    await expect(workoutRepository.findById(expected.id)).resolves.toEqual(
      expected,
    );
    await expect(workoutRepository.findSummaries()).resolves.toEqual([
      summarizeWorkout(expected),
    ]);
    await expect(routineRepository.findById(routine.id)).resolves.toEqual(
      edited,
    );
  });

  it('keeps workout history when the source routine is deleted', async () => {
    const routine = createRoutine();
    await routineRepository.create(routine);
    const workout = createWorkoutFromRoutine(routine);
    await workoutRepository.create(workout);

    await expect(routineRepository.delete(routine.id)).resolves.toBe(true);

    await expect(routineRepository.findById(routine.id)).resolves.toBeNull();
    await expect(workoutRepository.findById(workout.id)).resolves.toEqual(
      workout,
    );
    await expect(
      workoutRepository.findByRoutineAndDate(routine.id, workout.date),
    ).resolves.toEqual(workout);
    await expect(workoutRepository.findSummaries()).resolves.toEqual([
      summarizeWorkout(workout),
    ]);
    await expect(readWorkoutCounts(database)).resolves.toEqual({
      workouts: 1,
      exercises: 2,
      sets: 3,
    });
  });

  it('persists workouts and snapshots across a database close and reopen', async () => {
    const temporaryDatabase = createTestDatabasePath();
    let firstConnection: SqliteDatabase | null = null;
    let secondConnection: SqliteDatabase | null = null;

    try {
      firstConnection = await openTestDatabase(temporaryDatabase.path);
      const firstRoutineRepository = new SqliteRoutineRepository({
        database: firstConnection,
        generateId: createIdGenerator(),
      });
      const routine = createRoutine();
      await firstRoutineRepository.create(routine);
      const firstWorkoutRepository = new SqliteWorkoutRepository(
        firstConnection,
      );
      const workout = createWorkoutFromRoutine(routine);
      await firstWorkoutRepository.create(workout);
      await firstConnection.closeAsync();
      firstConnection = null;

      secondConnection = await openTestDatabase(temporaryDatabase.path);
      const secondWorkoutRepository = new SqliteWorkoutRepository(
        secondConnection,
      );
      const secondRoutineRepository = new SqliteRoutineRepository({
        database: secondConnection,
        generateId: createIdGenerator(),
      });

      await expect(
        secondWorkoutRepository.findById(workout.id),
      ).resolves.toEqual(workout);
      await expect(secondWorkoutRepository.findSummaries()).resolves.toEqual([
        summarizeWorkout(workout),
      ]);
      await expect(
        secondRoutineRepository.findById(routine.id),
      ).resolves.toEqual(routine);
    } finally {
      if (firstConnection !== null) {
        await firstConnection.closeAsync();
      }
      if (secondConnection !== null) {
        await secondConnection.closeAsync();
      }
      temporaryDatabase.cleanup();
    }
  });
});
