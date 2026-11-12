import { describe, expect, it, jest } from '@jest/globals';

import type {
  Routine,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import {
  DuplicateWorkoutError,
  type Workout,
  type WorkoutRecordingContext,
  type WorkoutRepository,
  type WorkoutSummary,
} from '../../domain/workouts';
import { saveWorkout } from './save-workout';

const CREATED = '2026-10-18T08:00:00.000Z';
const SAVED_AT = '2026-11-02T18:00:00.000Z';

function createRoutine(): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1],
    exercises: [],
    createdAt: CREATED,
    updatedAt: CREATED,
  };
}

function createContext(): WorkoutRecordingContext {
  return {
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    exercises: [
      {
        nameSnapshot: 'Back Squat',
        order: 0,
        plannedSets: 2,
        plannedRepsMin: 8,
        plannedRepsMax: 10,
        plannedWeightKg: 75,
        notesSnapshot: 'Brace before descending.',
      },
      {
        nameSnapshot: 'Leg Curl',
        order: 1,
        plannedSets: 1,
        plannedRepsMin: 10,
        plannedRepsMax: 12,
        plannedWeightKg: 30,
        notesSnapshot: 'Slow eccentric.',
      },
    ],
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

function createIdGenerator(): () => string {
  let nextId = 0;
  return () => `generated-${++nextId}`;
}

interface InMemoryRoutineRepository extends RoutineRepository {
  findByIdCalls: RoutineId[];
}

function createRoutineRepository(
  routine: Routine | null,
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

interface InMemoryWorkoutRepository extends WorkoutRepository {
  created: Workout[];
}

function createWorkoutRepository(
  createError?: Error,
): InMemoryWorkoutRepository {
  const created: Workout[] = [];

  return {
    created,
    async create(workout: Workout): Promise<void> {
      created.push(workout);
      if (createError !== undefined) {
        throw createError;
      }
    },
    async findAll(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
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
}

function createSaveDependencies(
  options: {
    routine?: Routine | null;
    createError?: Error;
  } = {},
) {
  return {
    routineRepository: createRoutineRepository(
      options.routine === undefined ? createRoutine() : options.routine,
    ),
    workoutRepository: createWorkoutRepository(options.createError),
    generateId: jest.fn(createIdGenerator()),
    now: jest.fn(() => SAVED_AT),
  };
}

describe('saveWorkout', () => {
  it('validates and persists the complete workout from the captured snapshot', async () => {
    const dependencies = createSaveDependencies();
    const expected: Workout = {
      id: 'generated-1',
      routineId: 'routine-1',
      date: '2026-11-02',
      routineNameSnapshot: 'Lower A',
      savedAt: SAVED_AT,
      exercises: [
        {
          id: 'generated-2',
          nameSnapshot: 'Back Squat',
          order: 0,
          plannedSets: 2,
          plannedRepsMin: 8,
          plannedRepsMax: 10,
          plannedWeightKg: 75,
          notesSnapshot: 'Brace before descending.',
          sets: [
            {
              id: 'generated-3',
              setNumber: 1,
              weightKg: 80,
              reps: 8,
            },
            {
              id: 'generated-4',
              setNumber: 2,
              weightKg: 82.5,
              reps: 7,
            },
          ],
        },
        {
          id: 'generated-5',
          nameSnapshot: 'Leg Curl',
          order: 1,
          plannedSets: 1,
          plannedRepsMin: 10,
          plannedRepsMax: 12,
          plannedWeightKg: 30,
          notesSnapshot: 'Slow eccentric.',
          sets: [
            {
              id: 'generated-6',
              setNumber: 1,
              weightKg: 32,
              reps: 12,
            },
          ],
        },
      ],
    };

    const result = await saveWorkout(
      { context: createContext(), actuals: validActuals() },
      dependencies,
    );

    expect(result).toEqual({ ok: true, workout: expected });
    expect(dependencies.workoutRepository.created).toEqual([expected]);
    expect(dependencies.routineRepository.findByIdCalls).toEqual([
      'routine-1',
    ]);
    expect(dependencies.generateId).toHaveBeenCalledTimes(6);
    expect(dependencies.now).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid actual values before touching persistence', async () => {
    const dependencies = createSaveDependencies();

    const result = await saveWorkout(
      {
        context: createContext(),
        actuals: [
          {
            sets: [
              { weightKg: 80, reps: 8 },
              { weightKg: 82.5, reps: 0 },
            ],
          },
          {
            sets: [{ weightKg: 32, reps: 12 }],
          },
        ],
      },
      dependencies,
    );

    expect(result).toEqual({
      ok: false,
      reason: 'validation',
      errors: [
        {
          field: 'exercises[0].sets[1].reps',
          code: 'workout.set.reps.invalid',
          message:
            'Las repeticiones deben ser un número entero mayor que cero.',
        },
      ],
    });
    expect(dependencies.routineRepository.findByIdCalls).toEqual([]);
    expect(dependencies.generateId).not.toHaveBeenCalled();
    expect(dependencies.now).not.toHaveBeenCalled();
    expect(dependencies.workoutRepository.created).toEqual([]);
  });

  it('returns a recoverable cancellation when the source routine was deleted', async () => {
    const dependencies = createSaveDependencies({ routine: null });

    const result = await saveWorkout(
      { context: createContext(), actuals: validActuals() },
      dependencies,
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
    expect(dependencies.routineRepository.findByIdCalls).toEqual([
      'routine-1',
    ]);
    expect(dependencies.generateId).not.toHaveBeenCalled();
    expect(dependencies.now).not.toHaveBeenCalled();
    expect(dependencies.workoutRepository.created).toEqual([]);
  });

  it('rejects a duplicate workout with a Spanish error', async () => {
    const duplicate = new DuplicateWorkoutError('routine-1', '2026-11-02');
    const dependencies = createSaveDependencies({ createError: duplicate });

    const result = await saveWorkout(
      { context: createContext(), actuals: validActuals() },
      dependencies,
    );

    expect(result).toEqual({
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
    expect(dependencies.workoutRepository.created).toHaveLength(1);
  });

  it('returns a recoverable persistence failure without exposing repository errors', async () => {
    const dependencies = createSaveDependencies({
      createError: new Error('database is locked'),
    });

    const result = await saveWorkout(
      { context: createContext(), actuals: validActuals() },
      dependencies,
    );

    expect(result).toEqual({
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
    expect(JSON.stringify(result)).not.toContain('database is locked');
  });
});
