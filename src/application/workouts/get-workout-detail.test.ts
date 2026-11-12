import { describe, expect, it } from '@jest/globals';

import type {
  Workout,
  WorkoutExercise,
  WorkoutRepository,
  WorkoutSet,
  WorkoutSummary,
} from '../../domain/workouts';
import { getWorkoutDetail } from './get-workout-detail';

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    setNumber: 1,
    weightKg: 80,
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
    plannedRepsMin: 8,
    plannedRepsMax: 10,
    plannedWeightKg: 75,
    notesSnapshot: 'Brace before descending.',
    sets: [
      createSet(),
      createSet({ id: 'set-2', setNumber: 2, weightKg: 82.5, reps: 7 }),
    ],
    ...overrides,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    savedAt: '2026-11-02T18:00:00.000Z',
    exercises: [createExercise()],
    ...overrides,
  };
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  findByIdCalls: string[];
}

function createRepository(
  workout: Workout | null,
  error?: Error,
): InMemoryWorkoutRepository {
  const findByIdCalls: string[] = [];

  return {
    findByIdCalls,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findById(id: string): Promise<Workout | null> {
      findByIdCalls.push(id);
      if (error !== undefined) {
        throw error;
      }
      return workout !== null && workout.id === id ? workout : null;
    },
    async findByRoutineAndDate(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findSummaries(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findSummariesByDateRange(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findPreviousPerformanceCandidates(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async updateActualSets(): Promise<void> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('getWorkoutDetail', () => {
  it('returns the complete saved workout snapshot', async () => {
    const workout = createWorkout();
    const repository = createRepository(workout);

    const result = await getWorkoutDetail('workout-1', {
      workoutRepository: repository,
    });

    expect(result).toEqual({ ok: true, workout });
    expect(repository.findByIdCalls).toEqual(['workout-1']);
  });

  it('keeps the historical record readable when its source routine no longer exists', async () => {
    const workout = createWorkout({ routineId: 'deleted-routine' });
    const repository = createRepository(workout);

    const result = await getWorkoutDetail(workout.id, {
      workoutRepository: repository,
    });

    expect(result).toEqual({ ok: true, workout });
    expect(result.ok && result.workout.routineId).toBe('deleted-routine');
  });

  it('reports a missing workout with a stable not-found error', async () => {
    const repository = createRepository(null);

    const result = await getWorkoutDetail('missing-workout', {
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workoutId',
          code: 'workout.notFound',
          message: 'No se encontró el entrenamiento.',
        },
      ],
    });
  });

  it('translates persistence failures without exposing their message', async () => {
    const repository = createRepository(
      null,
      new Error('SQLITE_IOERR: disk I/O error'),
    );

    const result = await getWorkoutDetail('workout-1', {
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workout',
          code: 'workout.load.failed',
          message: 'No se pudo cargar el entrenamiento.',
        },
      ],
    });
  });
});

