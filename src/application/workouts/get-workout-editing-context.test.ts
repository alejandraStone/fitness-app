import { describe, expect, it } from '@jest/globals';

import type { DateOnly } from '../../domain/routines';
import type {
  PreviousPerformanceCandidateOptions,
  Workout,
  WorkoutExercise,
  WorkoutRepository,
  WorkoutSet,
  WorkoutSummary,
} from '../../domain/workouts';
import { getWorkoutEditingContext } from './get-workout-editing-context';

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
    plannedSets: 1,
    plannedRepsMin: 8,
    plannedRepsMax: 10,
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
    savedAt: '2026-11-02T18:00:00.000Z',
    exercises: [
      createExercise(),
      createExercise({
        id: 'workout-exercise-2',
        nameSnapshot: 'Leg Curl',
        order: 1,
        plannedWeightKg: 30,
        sets: [createSet({ id: 'set-3', weightKg: 30, reps: 12 })],
      }),
    ],
    ...overrides,
  };
}

interface PreviousPerformanceCall {
  selectedDate: DateOnly;
  options: PreviousPerformanceCandidateOptions | undefined;
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  previousPerformanceCalls: PreviousPerformanceCall[];
}

function createRepository(
  workout: Workout | null,
  candidates: Workout[] = [],
  previousError?: Error,
): InMemoryWorkoutRepository {
  const previousPerformanceCalls: PreviousPerformanceCall[] = [];

  return {
    previousPerformanceCalls,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async findById(id: string): Promise<Workout | null> {
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
    async findPreviousPerformanceCandidates(
      selectedDate: DateOnly,
      options?: PreviousPerformanceCandidateOptions,
    ): Promise<Workout[]> {
      previousPerformanceCalls.push({ selectedDate, options });
      if (previousError !== undefined) {
        throw previousError;
      }
      return candidates;
    },
    async updateActualSets(): Promise<void> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('getWorkoutEditingContext', () => {
  it('returns the saved workout and aligned earlier results, excluding the current workout', async () => {
    const workout = createWorkout();
    const currentCopy = createWorkout({ savedAt: '2026-11-02T19:00:00.000Z' });
    const earlierSquat = createWorkout({
      id: 'workout-earlier',
      routineId: 'routine-2',
      date: '2026-10-30',
      routineNameSnapshot: 'Full body',
      savedAt: '2026-10-30T18:00:00.000Z',
      exercises: [
        createExercise({
          id: 'earlier-exercise',
          nameSnapshot: '  back SQUAT ',
          sets: [createSet({ id: 'earlier-set', weightKg: 85, reps: 6 })],
        }),
      ],
    });
    const repository = createRepository(workout, [
      currentCopy,
      earlierSquat,
      createWorkout({
        id: 'workout-future',
        date: '2026-11-05',
        savedAt: '2026-11-05T18:00:00.000Z',
      }),
    ]);

    const result = await getWorkoutEditingContext(workout.id, {
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: true,
      workout,
      previousPerformances: [
        {
          workoutId: 'workout-earlier',
          date: '2026-10-30',
          sets: [{ setNumber: 1, weightKg: 85, reps: 6 }],
        },
        null,
      ],
    });
    expect(repository.previousPerformanceCalls).toEqual([
      {
        selectedDate: '2026-11-02',
        options: { excludeWorkoutId: 'workout-1' },
      },
    ]);
  });

  it('reports a missing workout as not found', async () => {
    const repository = createRepository(null);

    const result = await getWorkoutEditingContext('missing-workout', {
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
    expect(repository.previousPerformanceCalls).toEqual([]);
  });

  it('translates previous-performance read failures without exposing persistence details', async () => {
    const workout = createWorkout();
    const repository = createRepository(
      workout,
      [],
      new Error('SQLITE_BUSY: database is locked'),
    );

    const result = await getWorkoutEditingContext(workout.id, {
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
