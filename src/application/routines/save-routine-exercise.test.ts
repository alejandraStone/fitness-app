import { describe, expect, it, jest } from '@jest/globals';

import type {
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import { saveRoutineExercise } from './save-routine-exercise';

const CREATED = '2026-10-18T08:00:00.000Z';
const UPDATED = '2026-10-20T12:00:00.000Z';

function createExercise(
  id: string,
  name: string,
  order: number,
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id,
    routineId: 'routine-1',
    name,
    order,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeightKg: 20,
    ...overrides,
  };
}

function createRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Lower A',
    weekdays: [1, 3],
    exercises: [
      createExercise('exercise-1', 'Back Squat', 0),
      createExercise('exercise-2', 'Leg Press', 1),
    ],
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

interface InMemoryRoutineRepository extends RoutineRepository {
  updates: Routine[];
}

function createRepository(routine: Routine | null): InMemoryRoutineRepository {
  const updates: Routine[] = [];

  return {
    updates,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      return routine === null ? [] : [routine];
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      return routine !== null && routine.id === id ? routine : null;
    },
    async update(updated: Routine): Promise<void> {
      updates.push(updated);
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('saveRoutineExercise', () => {
  it('adds a new exercise at the end without changing the schedule', async () => {
    const existing = createRoutine();
    const repository = createRepository(existing);
    const generateId = jest.fn(() => 'exercise-new');

    const result = await saveRoutineExercise(
      {
        routineId: 'routine-1',
        exercise: {
          name: '  Leg Extension  ',
          targetSets: 4,
          targetRepsMin: 10,
          targetRepsMax: 15,
          targetWeightKg: 35,
        },
      },
      {
        routineRepository: repository,
        generateId,
        now: () => UPDATED,
      },
    );

    if (!result.ok) {
      throw new Error('Expected the exercise to be saved.');
    }

    expect(result.routine.weekdays).toEqual([1, 3]);
    expect(result.routine.exercises).toHaveLength(3);
    expect(result.routine.exercises[2]).toEqual({
      id: 'exercise-new',
      routineId: 'routine-1',
      name: 'Leg Extension',
      order: 2,
      targetSets: 4,
      targetRepsMin: 10,
      targetRepsMax: 15,
      targetWeightKg: 35,
    });
    expect(result.routine.updatedAt).toBe(UPDATED);
    expect(repository.updates).toEqual([result.routine]);
  });

  it('edits an exercise in place while preserving its identifier and order', async () => {
    const existing = createRoutine();
    const repository = createRepository(existing);

    const result = await saveRoutineExercise(
      {
        routineId: 'routine-1',
        exerciseId: 'exercise-2',
        exercise: {
          name: 'Leg Press',
          notes: '  Slow eccentric  ',
          targetSets: 5,
          targetRepsMin: 12,
          targetRepsMax: 15,
          targetWeightKg: 60,
        },
      },
      {
        routineRepository: repository,
        generateId: jest.fn(() => 'unused-id'),
        now: () => UPDATED,
      },
    );

    if (!result.ok) {
      throw new Error('Expected the exercise to be updated.');
    }

    expect(result.routine.exercises[1]).toEqual({
      id: 'exercise-2',
      routineId: 'routine-1',
      name: 'Leg Press',
      notes: 'Slow eccentric',
      order: 1,
      targetSets: 5,
      targetRepsMin: 12,
      targetRepsMax: 15,
      targetWeightKg: 60,
    });
    expect(result.routine.exercises[0].id).toBe('exercise-1');
    expect(repository.updates).toEqual([result.routine]);
  });

  it('rejects an exercise that does not belong to the routine', async () => {
    const repository = createRepository(createRoutine());

    const result = await saveRoutineExercise(
      {
        routineId: 'routine-1',
        exerciseId: 'unknown-exercise',
        exercise: {
          name: 'Leg Press',
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 12,
          targetWeightKg: 20,
        },
      },
      {
        routineRepository: repository,
        generateId: jest.fn(() => 'unused-id'),
        now: () => UPDATED,
      },
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'exerciseId',
          code: 'exercise.unknownId',
          message: 'El ejercicio no pertenece a esta rutina.',
        },
      ],
    });
    expect(repository.updates).toEqual([]);
  });

  it('rejects a missing routine before writing', async () => {
    const repository = createRepository(null);

    const result = await saveRoutineExercise(
      {
        routineId: 'routine-1',
        exercise: {
          name: 'Leg Press',
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 12,
          targetWeightKg: 20,
        },
      },
      {
        routineRepository: repository,
        generateId: jest.fn(() => 'unused-id'),
        now: () => UPDATED,
      },
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'routineId',
          code: 'routine.notFound',
          message: 'No se encontró la rutina.',
        },
      ],
    });
    expect(repository.updates).toEqual([]);
  });

  it('returns domain validation errors without writing', async () => {
    const repository = createRepository(createRoutine());

    const result = await saveRoutineExercise(
      {
        routineId: 'routine-1',
        exercise: {
          name: '   ',
          targetSets: 0,
          targetRepsMin: 12,
          targetRepsMax: 8,
          targetWeightKg: -1,
        },
      },
      {
        routineRepository: repository,
        generateId: jest.fn(() => 'unused-id'),
        now: () => UPDATED,
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.field === 'name')).toBe(true);
      expect(result.errors.some((error) => error.field === 'targetSets')).toBe(
        true,
      );
      expect(result.errors.some((error) => error.field === 'targetRepsMax')).toBe(
        true,
      );
      expect(result.errors.some((error) => error.field === 'targetWeightKg')).toBe(
        true,
      );
    }
    expect(repository.updates).toEqual([]);
  });
});
