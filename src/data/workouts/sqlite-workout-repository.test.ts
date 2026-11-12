/** @jest-environment node */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  DuplicateWorkoutError,
  summarizeWorkout,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
} from '../../domain/workouts';
import type { SqliteDatabase } from '../database/sqlite-database';
import { openTestDatabase } from '../database/testing/test-database';
import { SqliteWorkoutRepository } from './sqlite-workout-repository';

const SAVED_AT = '2026-11-02T18:00:00.000Z';

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    setNumber: 1,
    weightKg: 75,
    reps: 8,
    ...overrides,
  };
}

function createExercise(
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: 'workout-exercise-1',
    nameSnapshot: 'Back Squat',
    order: 0,
    plannedSets: 2,
    plannedRepsMin: 6,
    plannedRepsMax: 8,
    plannedWeightKg: 75,
    sets: [createSet()],
    ...overrides,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    savedAt: SAVED_AT,
    exercises: [createExercise()],
    ...overrides,
  };
}

function createWorkoutWithIds(
  id: string,
  routineId: string,
  date: string,
): Workout {
  return createWorkout({
    id,
    routineId,
    date,
    exercises: [
      createExercise({
        id: `${id}-exercise-1`,
        sets: [createSet({ id: `${id}-set-1` })],
      }),
    ],
  });
}

function createAggregateWorkout(
  id: string,
  date: string,
  savedAt: string,
  exerciseReps: number[][],
): Workout {
  return {
    id,
    routineId: `${id}-routine`,
    date,
    routineNameSnapshot: `Routine ${id}`,
    savedAt,
    exercises: exerciseReps.map((reps, exerciseIndex) => ({
      id: `${id}-exercise-${exerciseIndex + 1}`,
      nameSnapshot: `Exercise ${exerciseIndex + 1}`,
      order: exerciseIndex,
      plannedSets: reps.length,
      plannedRepsMin: 1,
      plannedRepsMax: 10,
      plannedWeightKg: 20,
      sets: reps.map((repCount, setIndex) => ({
        id: `${id}-set-${exerciseIndex + 1}-${setIndex + 1}`,
        setNumber: setIndex + 1,
        weightKg: 20,
        reps: repCount,
      })),
    })),
  };
}

describe('SqliteWorkoutRepository', () => {
  let database: SqliteDatabase;
  let repository: SqliteWorkoutRepository;

  beforeEach(async () => {
    database = await openTestDatabase();
    repository = new SqliteWorkoutRepository(database);
  });

  afterEach(async () => {
    await database.closeAsync();
  });

  it('creates and reads back a workout with ordered exercises and sets', async () => {
    const squatSetTwo = createSet({
      id: 'set-2',
      setNumber: 2,
      weightKg: 72.5,
      reps: 7,
    });
    const squatSetOne = createSet({
      id: 'set-1',
      setNumber: 1,
      weightKg: 75,
      reps: 8,
    });
    const legCurl = createExercise({
      id: 'workout-exercise-2',
      nameSnapshot: 'Leg Curl',
      order: 1,
      plannedSets: 1,
      plannedRepsMin: 8,
      plannedRepsMax: 12,
      plannedWeightKg: 30,
      sets: [createSet({ id: 'set-3', weightKg: 30, reps: 12 })],
    });
    const squat = createExercise({
      notesSnapshot: 'Pause at the bottom',
      sets: [squatSetTwo, squatSetOne],
    });
    const workout = createWorkout({ exercises: [legCurl, squat] });

    await repository.create(workout);

    const expected = createWorkout({
      exercises: [
        createExercise({
          notesSnapshot: 'Pause at the bottom',
          sets: [squatSetOne, squatSetTwo],
        }),
        legCurl,
      ],
    });

    await expect(repository.findById(workout.id)).resolves.toEqual(expected);
    await expect(
      repository.findByRoutineAndDate(
        workout.routineId,
        workout.date,
      ),
    ).resolves.toEqual(expected);
  });

  it('returns null for missing workout identifiers and routine/date pairs', async () => {
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(
      repository.findByRoutineAndDate('routine-1', '2026-11-02'),
    ).resolves.toBeNull();
  });

  it('rejects a duplicate routine/date with a domain-level failure and no partial data', async () => {
    const first = createWorkoutWithIds(
      'workout-1',
      'routine-1',
      '2026-11-02',
    );
    const duplicate = createWorkoutWithIds(
      'workout-2',
      'routine-1',
      '2026-11-02',
    );
    duplicate.savedAt = '2026-11-02T19:00:00.000Z';

    await repository.create(first);

    try {
      await repository.create(duplicate);
      throw new Error('Expected duplicate workout creation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateWorkoutError);
      expect(error).toMatchObject({
        name: 'DuplicateWorkoutError',
        code: 'workout.duplicate',
        routineId: 'routine-1',
        date: '2026-11-02',
        message:
          'Ya existe un entrenamiento guardado para esta rutina y fecha.',
      });
    }

    await expect(repository.findById(duplicate.id)).resolves.toBeNull();
    await expect(readCounts(database)).resolves.toEqual({
      workouts: 1,
      exercises: 1,
      sets: 1,
    });
  });

  it('allows the same routine on another date and another routine on the same date', async () => {
    const first = createWorkoutWithIds(
      'workout-1',
      'routine-1',
      '2026-11-02',
    );
    const nextDay = createWorkoutWithIds(
      'workout-2',
      'routine-1',
      '2026-11-03',
    );
    const otherRoutine = createWorkoutWithIds(
      'workout-3',
      'routine-2',
      '2026-11-02',
    );

    await repository.create(first);
    await repository.create(nextDay);
    await repository.create(otherRoutine);

    await expect(
      repository.findByRoutineAndDate('routine-1', '2026-11-02'),
    ).resolves.toEqual(first);
    await expect(
      repository.findByRoutineAndDate('routine-1', '2026-11-03'),
    ).resolves.toEqual(nextDay);
    await expect(
      repository.findByRoutineAndDate('routine-2', '2026-11-02'),
    ).resolves.toEqual(otherRoutine);
  });

  it('rolls back the whole workout when a child insert fails', async () => {
    const invalid = createWorkout({
      exercises: [
        createExercise({
          sets: [
            createSet({ id: 'set-1', setNumber: 1 }),
            createSet({ id: 'set-2', setNumber: 1 }),
          ],
        }),
      ],
    });

    try {
      await repository.create(invalid);
      throw new Error('Expected workout creation to fail.');
    } catch (error) {
      expect(error).not.toBeInstanceOf(DuplicateWorkoutError);
      expect(
        (error as { message?: unknown }).message,
      ).toEqual(expect.stringMatching(/UNIQUE constraint failed: sets/));
    }

    await expect(repository.findById(invalid.id)).resolves.toBeNull();
    await expect(readCounts(database)).resolves.toEqual({
      workouts: 0,
      exercises: 0,
      sets: 0,
    });
  });

  it('updates only actual set weights and repetitions', async () => {
    const original = createWorkout({
      exercises: [
        createExercise({
          notesSnapshot: 'Pause at the bottom',
          sets: [
            createSet({ id: 'set-1', setNumber: 1, weightKg: 75, reps: 8 }),
            createSet({ id: 'set-2', setNumber: 2, weightKg: 72.5, reps: 7 }),
          ],
        }),
      ],
    });
    await repository.create(original);
    const snapshotBefore = await readSnapshotRows(database, original.id);

    const update: Workout = {
      ...original,
      routineId: 'routine-changed',
      date: '2026-12-31',
      routineNameSnapshot: 'Changed routine',
      savedAt: '2026-12-31T00:00:00.000Z',
      exercises: [
        {
          ...original.exercises[0],
          nameSnapshot: 'Changed exercise',
          order: 9,
          plannedSets: 99,
          plannedRepsMin: 1,
          plannedRepsMax: 2,
          plannedWeightKg: 999,
          notesSnapshot: 'Changed notes',
          sets: [
            { ...original.exercises[0].sets[0], weightKg: 80, reps: 9 },
            { ...original.exercises[0].sets[1], weightKg: 77.5, reps: 6 },
          ],
        },
      ],
    };

    await repository.updateActualSets(update);

    const expected = createWorkout({
      exercises: [
        createExercise({
          notesSnapshot: 'Pause at the bottom',
          sets: [
            createSet({ id: 'set-1', setNumber: 1, weightKg: 80, reps: 9 }),
            createSet({
              id: 'set-2',
              setNumber: 2,
              weightKg: 77.5,
              reps: 6,
            }),
          ],
        }),
      ],
    });

    await expect(repository.findById(original.id)).resolves.toEqual(expected);
    await expect(
      readSnapshotRows(database, original.id),
    ).resolves.toEqual(snapshotBefore);
  });

  it('rejects updates for an unknown workout without creating data', async () => {
    const missing = createWorkoutWithIds(
      'missing',
      'routine-1',
      '2026-11-02',
    );

    await expect(repository.updateActualSets(missing)).rejects.toThrow(
      'was not found',
    );

    await expect(readCounts(database)).resolves.toEqual({
      workouts: 0,
      exercises: 0,
      sets: 0,
    });
  });

  it('rejects a set from another workout and rolls back partial updates', async () => {
    const first = createWorkoutWithIds(
      'workout-1',
      'routine-1',
      '2026-11-02',
    );
    const second = createWorkoutWithIds(
      'workout-2',
      'routine-2',
      '2026-11-02',
    );
    await repository.create(first);
    await repository.create(second);
    const snapshotBefore = await readSnapshotRows(database, first.id);

    const update: Workout = {
      ...first,
      exercises: [
        {
          ...first.exercises[0],
          sets: [
            { ...first.exercises[0].sets[0], weightKg: 100, reps: 5 },
            { ...second.exercises[0].sets[0], weightKg: 200, reps: 3 },
          ],
        },
      ],
    };

    await expect(repository.updateActualSets(update)).rejects.toThrow(
      'does not belong to workout exercise',
    );

    await expect(repository.findById(first.id)).resolves.toEqual(first);
    await expect(repository.findById(second.id)).resolves.toEqual(second);
    await expect(
      readSnapshotRows(database, first.id),
    ).resolves.toEqual(snapshotBefore);
  });

  it('rejects an exercise from another workout', async () => {
    const first = createWorkoutWithIds(
      'workout-1',
      'routine-1',
      '2026-11-02',
    );
    const second = createWorkoutWithIds(
      'workout-2',
      'routine-2',
      '2026-11-02',
    );
    await repository.create(first);
    await repository.create(second);

    const update: Workout = {
      ...first,
      exercises: [second.exercises[0]],
    };

    await expect(repository.updateActualSets(update)).rejects.toThrow(
      'does not belong to workout',
    );

    await expect(repository.findById(first.id)).resolves.toEqual(first);
    await expect(repository.findById(second.id)).resolves.toEqual(second);
  });

  it('returns full-history summaries ordered by date and savedAt with aggregate counts', async () => {
    const older = createAggregateWorkout(
      'workout-a',
      '2026-11-01',
      '2026-11-01T10:00:00.000Z',
      [[8, 7], [12]],
    );
    const sameDayEarly = createAggregateWorkout(
      'workout-b',
      '2026-11-02',
      '2026-11-02T09:00:00.000Z',
      [[5]],
    );
    const sameDayLate = createAggregateWorkout(
      'workout-c',
      '2026-11-02',
      '2026-11-02T11:00:00.000Z',
      [[6, 6]],
    );

    await repository.create(sameDayEarly);
    await repository.create(older);
    await repository.create(sameDayLate);

    const summaries = await repository.findSummaries();

    expect(summaries).toEqual([
      summarizeWorkout(sameDayLate),
      summarizeWorkout(sameDayEarly),
      summarizeWorkout(older),
    ]);
    expect(summaries[2]).toMatchObject({
      exerciseCount: 2,
      totalSets: 3,
      totalReps: 27,
    });
  });

  it('returns summaries within a half-open month range', async () => {
    const october = createAggregateWorkout(
      'october',
      '2026-10-31',
      '2026-10-31T10:00:00.000Z',
      [[5]],
    );
    const firstDay = createAggregateWorkout(
      'first-day',
      '2026-11-01',
      '2026-11-01T09:00:00.000Z',
      [[6]],
    );
    const lastDay = createAggregateWorkout(
      'last-day',
      '2026-11-30',
      '2026-11-30T10:00:00.000Z',
      [[7]],
    );
    const december = createAggregateWorkout(
      'december',
      '2026-12-01',
      '2026-12-01T10:00:00.000Z',
      [[8]],
    );

    await repository.create(october);
    await repository.create(firstDay);
    await repository.create(lastDay);
    await repository.create(december);

    await expect(
      repository.findSummariesByDateRange('2026-11-01', '2026-12-01'),
    ).resolves.toEqual([
      summarizeWorkout(lastDay),
      summarizeWorkout(firstDay),
    ]);
    await expect(
      repository.findSummariesByDateRange('2026-11-02', '2026-11-30'),
    ).resolves.toEqual([]);
  });

  it('returns previous-performance candidates before the selected date with optional exclusion', async () => {
    const early = createAggregateWorkout(
      'early',
      '2026-10-30',
      '2026-10-30T10:00:00.000Z',
      [[8]],
    );
    const sameDayEarly = createAggregateWorkout(
      'same-day-early',
      '2026-11-01',
      '2026-11-01T09:00:00.000Z',
      [[8]],
    );
    const sameDayLate = createAggregateWorkout(
      'same-day-late',
      '2026-11-01',
      '2026-11-01T12:00:00.000Z',
      [[8]],
    );
    const excluded = createAggregateWorkout(
      'excluded',
      '2026-11-01',
      '2026-11-01T13:00:00.000Z',
      [[8]],
    );
    const selectedDay = createAggregateWorkout(
      'selected-day',
      '2026-11-02',
      '2026-11-02T08:00:00.000Z',
      [[8]],
    );
    const future = createAggregateWorkout(
      'future',
      '2026-11-03',
      '2026-11-03T08:00:00.000Z',
      [[8]],
    );

    await repository.create(early);
    await repository.create(sameDayEarly);
    await repository.create(sameDayLate);
    await repository.create(excluded);
    await repository.create(selectedDay);
    await repository.create(future);

    await expect(
      repository.findPreviousPerformanceCandidates('2026-11-02'),
    ).resolves.toEqual([excluded, sameDayLate, sameDayEarly, early]);
    await expect(
      repository.findPreviousPerformanceCandidates('2026-11-02', {
        excludeWorkoutId: excluded.id,
      }),
    ).resolves.toEqual([sameDayLate, sameDayEarly, early]);
    await expect(
      repository.findPreviousPerformanceCandidates('2026-10-29'),
    ).resolves.toEqual([]);
  });
});

async function readCounts(
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

interface SnapshotWorkoutRow {
  id: string;
  routine_id: string;
  date: string;
  routine_name_snapshot: string;
  saved_at: string | null;
}

interface SnapshotExerciseRow {
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

async function readSnapshotRows(
  database: SqliteDatabase,
  workoutId: string,
): Promise<{
  workout: SnapshotWorkoutRow | null;
  exercises: SnapshotExerciseRow[];
}> {
  const workout = await database.getFirstAsync<SnapshotWorkoutRow>(
    `SELECT id, routine_id, date, routine_name_snapshot, saved_at
     FROM workouts WHERE id = ?`,
    [workoutId],
  );
  const exercises = await database.getAllAsync<SnapshotExerciseRow>(
    `SELECT
       id, workout_id, name_snapshot, position, planned_sets,
       planned_reps_min, planned_reps_max, planned_weight_kg, notes_snapshot
     FROM workout_exercises
     WHERE workout_id = ? ORDER BY position ASC, id ASC`,
    [workoutId],
  );

  return { workout, exercises };
}
