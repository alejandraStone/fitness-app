import { describe, expect, it } from '@jest/globals';

import type { ProgressionDecisionRepository } from '../../domain/progression';
import type {
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import type {
  Workout,
  WorkoutExercise,
  WorkoutExerciseId,
  WorkoutId,
  WorkoutRepository,
  WorkoutSet,
  WorkoutSummary,
} from '../../domain/workouts';
import { getWorkoutProgression } from './get-workout-progression';

const SAVED_AT = '2026-11-10T18:00:00.000Z';

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    setNumber: 1,
    weightKg: 50,
    reps: 8,
    ...overrides,
  };
}

function createExercise(
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return {
    id: 'workout-exercise-1',
    nameSnapshot: 'Sentadilla',
    order: 0,
    plannedSets: 3,
    plannedRepsMin: 6,
    plannedRepsMax: 8,
    plannedWeightKg: 50,
    sets: [
      createSet({ id: 'set-1', setNumber: 1 }),
      createSet({ id: 'set-2', setNumber: 2 }),
      createSet({ id: 'set-3', setNumber: 3 }),
    ],
    ...overrides,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-10',
    routineNameSnapshot: 'Pierna A',
    savedAt: SAVED_AT,
    exercises: [createExercise()],
    ...overrides,
  };
}

function createRoutineExercise(
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id: 'routine-exercise-1',
    routineId: 'routine-1',
    name: 'Sentadilla',
    order: 0,
    targetSets: 3,
    targetRepsMin: 6,
    targetRepsMax: 8,
    targetWeightKg: 50,
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Pierna A',
    weekdays: [1],
    exercises: [createRoutineExercise()],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  findAllCalls: number;
}

function createWorkoutRepository(
  workouts: Workout[] = [],
  error?: Error,
): InMemoryWorkoutRepository {
  const repository: InMemoryWorkoutRepository = {
    findAllCalls: 0,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Workout[]> {
      repository.findAllCalls += 1;
      if (error !== undefined) {
        throw error;
      }
      return workouts;
    },
    async findById(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
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

  return repository;
}

interface InMemoryRoutineRepository extends RoutineRepository {
  findByIdCalls: RoutineId[];
}

function createRoutineRepository(
  routine: Routine | null,
  error?: Error,
): InMemoryRoutineRepository {
  const findByIdCalls: RoutineId[] = [];

  return {
    findByIdCalls,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      throw new Error('Not used in this test.');
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      findByIdCalls.push(id);
      if (error !== undefined) {
        throw error;
      }
      return routine !== null && routine.id === id ? routine : null;
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

interface InMemoryDecisionRepository extends ProgressionDecisionRepository {
  readCalls: WorkoutId[];
}

function createDecisionRepository(
  decisionIds: WorkoutExerciseId[] = [],
  error?: Error,
): InMemoryDecisionRepository {
  const readCalls: WorkoutId[] = [];

  return {
    readCalls,
    async findKeepWeightDecisionIds(
      workoutId: WorkoutId,
    ): Promise<WorkoutExerciseId[]> {
      readCalls.push(workoutId);
      if (error !== undefined) {
        throw error;
      }
      return decisionIds;
    },
    async saveKeepWeightDecision(): Promise<void> {
      throw new Error('Not used in this test.');
    },
  };
}

function createDependencies(options: {
  workouts?: Workout[];
  workoutError?: Error;
  routine?: Routine | null;
  routineError?: Error;
  decisions?: WorkoutExerciseId[];
  decisionError?: Error;
} = {}) {
  return {
    workoutRepository: createWorkoutRepository(
      options.workouts ?? [],
      options.workoutError,
    ),
    routineRepository: createRoutineRepository(
      options.routine === undefined ? createRoutine() : options.routine,
      options.routineError,
    ),
    progressionDecisionRepository: createDecisionRepository(
      options.decisions ?? [],
      options.decisionError,
    ),
  };
}

describe('getWorkoutProgression', () => {
  it('returns pending recommendations for the latest qualifying session', async () => {
    const workout = createWorkout();
    const dependencies = createDependencies({ workouts: [workout] });

    const result = await getWorkoutProgression(workout.id, dependencies);

    expect(result).toEqual({
      ok: true,
      recommendations: [
        {
          workoutExerciseId: 'workout-exercise-1',
          exerciseName: 'Sentadilla',
          repetitions: [8, 8, 8],
          plannedRepsMax: 8,
        },
      ],
    });
    expect(dependencies.workoutRepository.findAllCalls).toBe(1);
    expect(dependencies.routineRepository.findByIdCalls).toEqual([
      workout.routineId,
    ]);
    expect(dependencies.progressionDecisionRepository.readCalls).toEqual([
      workout.id,
    ]);
  });

  it('returns no recommendations when the source routine was deleted', async () => {
    const workout = createWorkout();
    const result = await getWorkoutProgression(
      workout.id,
      createDependencies({ workouts: [workout], routine: null }),
    );

    expect(result).toEqual({ ok: true, recommendations: [] });
  });

  it('returns no recommendations for a keep-weight decision', async () => {
    const workout = createWorkout();
    const result = await getWorkoutProgression(
      workout.id,
      createDependencies({
        workouts: [workout],
        decisions: ['workout-exercise-1'],
      }),
    );

    expect(result).toEqual({ ok: true, recommendations: [] });
  });

  it('returns no recommendations when the planned weight changed', async () => {
    const workout = createWorkout();
    const routine = createRoutine({
      exercises: [createRoutineExercise({ targetWeightKg: 55 })],
    });

    const result = await getWorkoutProgression(
      workout.id,
      createDependencies({ workouts: [workout], routine }),
    );

    expect(result).toEqual({ ok: true, recommendations: [] });
  });

  it('returns no recommendations when a newer session exists', async () => {
    const older = createWorkout();
    const newer = createWorkout({
      id: 'workout-2',
      date: '2026-11-11',
      savedAt: '2026-11-11T18:00:00.000Z',
      exercises: [
        createExercise({
          id: 'workout-exercise-2',
          sets: [
            createSet({ id: 'newer-set-1', setNumber: 1, reps: 7 }),
            createSet({ id: 'newer-set-2', setNumber: 2 }),
            createSet({ id: 'newer-set-3', setNumber: 3 }),
          ],
        }),
      ],
    });

    const result = await getWorkoutProgression(
      older.id,
      createDependencies({ workouts: [older, newer] }),
    );

    expect(result).toEqual({ ok: true, recommendations: [] });
  });

  it('reports a missing workout as a recoverable load failure', async () => {
    const result = await getWorkoutProgression(
      'missing-workout',
      createDependencies({ workouts: [createWorkout()] }),
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      errors: [{ code: 'progression.load.failed' }],
    });
  });

  it('translates workout read failures without exposing storage details', async () => {
    const result = await getWorkoutProgression(
      'workout-1',
      createDependencies({
        workoutError: new Error('SQLITE_IOERR'),
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workoutId',
          code: 'progression.load.failed',
          message: 'No se pudieron cargar las recomendaciones.',
        },
      ],
    });
  });

  it('translates routine read failures without exposing storage details', async () => {
    const workout = createWorkout();
    const result = await getWorkoutProgression(
      workout.id,
      createDependencies({
        workouts: [workout],
        routineError: new Error('SQLITE_BUSY'),
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workoutId',
          code: 'progression.load.failed',
          message: 'No se pudieron cargar las recomendaciones.',
        },
      ],
    });
  });

  it('translates decision read failures without exposing storage details', async () => {
    const workout = createWorkout();
    const result = await getWorkoutProgression(
      workout.id,
      createDependencies({
        workouts: [workout],
        decisionError: new Error('database is locked'),
      }),
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workoutId',
          code: 'progression.load.failed',
          message: 'No se pudieron cargar las recomendaciones.',
        },
      ],
    });
  });
});
