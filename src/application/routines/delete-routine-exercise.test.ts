import { describe, expect, it, jest } from '@jest/globals';

import type {
  Routine,
  RoutineExercise,
  RoutineId,
  RoutineRepository,
} from '../../domain/routines';
import { deleteRoutineExercise } from './delete-routine-exercise';

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
      createExercise('exercise-3', 'Calf Raise', 2),
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

const dependencies = (repository: InMemoryRoutineRepository) => ({
  routineRepository: repository,
  generateId: jest.fn(() => 'unused-id'),
  now: () => UPDATED,
});

describe('deleteRoutineExercise', () => {
  it('removes the entry and keeps the remaining order', async () => {
    const repository = createRepository(createRoutine());

    const result = await deleteRoutineExercise(
      { routineId: 'routine-1', exerciseId: 'exercise-2' },
      dependencies(repository),
    );

    if (!result.ok) {
      throw new Error('Expected the exercise to be removed.');
    }

    expect(result.routine.weekdays).toEqual([1, 3]);
    expect(result.routine.exercises.map((exercise) => exercise.name)).toEqual([
      'Back Squat',
      'Calf Raise',
    ]);
    expect(result.routine.exercises.map((exercise) => exercise.order)).toEqual([
      0, 1,
    ]);
    expect(repository.updates).toEqual([result.routine]);
  });

  it('rejects an exercise that does not belong to the routine', async () => {
    const repository = createRepository(createRoutine());

    const result = await deleteRoutineExercise(
      { routineId: 'routine-1', exerciseId: 'unknown-exercise' },
      dependencies(repository),
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

    const result = await deleteRoutineExercise(
      { routineId: 'routine-1', exerciseId: 'exercise-1' },
      dependencies(repository),
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

  it('does not allow the routine to be left without exercises', async () => {
    const repository = createRepository(
      createRoutine({
        exercises: [createExercise('exercise-1', 'Back Squat', 0)],
      }),
    );

    const result = await deleteRoutineExercise(
      { routineId: 'routine-1', exerciseId: 'exercise-1' },
      dependencies(repository),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        expect.objectContaining({ field: 'exercises' }),
      ]);
    }
    expect(repository.updates).toEqual([]);
  });
});
