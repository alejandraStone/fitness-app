import { describe, expect, it } from '@jest/globals';

import type {
  RoutineId,
  Routine,
  RoutineExercise,
  RoutineRepository,
} from '../../domain/routines';
import { getRoutineById } from './get-routine-by-id';

const NOW = '2026-10-19T10:00:00.000Z';

function createExercise(
  routineId: string,
  id: string,
  name: string,
  order: number,
): RoutineExercise {
  return {
    id,
    routineId,
    name,
    order,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 10,
    targetWeightKg: 50,
  };
}

function createRoutine(
  id: string,
  name: string,
  exercises: RoutineExercise[],
): Routine {
  return {
    id,
    name,
    weekdays: [1, 3],
    exercises,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function createRepository(routines: Routine[] = []): RoutineRepository {
  return {
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      return routines;
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      return routines.find((routine) => routine.id === id) ?? null;
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('getRoutineById', () => {
  it('returns the requested routine with exercise entries in configured order', async () => {
    const routine = createRoutine('routine-1', 'Lower A', [
      createExercise('routine-1', 'exercise-2', 'Leg Press', 1),
      createExercise('routine-1', 'exercise-1', 'Back Squat', 0),
    ]);

    const result = await getRoutineById('routine-1', {
      routineRepository: createRepository([routine]),
    });

    expect(result).toEqual({
      ...routine,
      exercises: [routine.exercises[1], routine.exercises[0]],
    });
  });

  it('returns null for an unknown identifier', async () => {
    const result = await getRoutineById('missing-routine', {
      routineRepository: createRepository([
        createRoutine('routine-1', 'Lower A', [
          createExercise('routine-1', 'exercise-1', 'Back Squat', 0),
        ]),
      ]),
    });

    expect(result).toBeNull();
  });

  it('passes the requested identifier to the repository', async () => {
    let requestedId: RoutineId | undefined;
    const repository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async findAll(): Promise<Routine[]> {
        return [];
      },
      async findById(id: RoutineId): Promise<Routine | null> {
        requestedId = id;
        return null;
      },
      async update(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async delete(): Promise<boolean> {
        throw new Error('Not used in this test.');
      },
    };

    await getRoutineById('routine-42', { routineRepository: repository });

    expect(requestedId).toBe('routine-42');
  });

  it('does not mutate the routine returned by the repository', async () => {
    const routine = createRoutine('routine-1', 'Lower A', [
      createExercise('routine-1', 'exercise-2', 'Leg Press', 1),
      createExercise('routine-1', 'exercise-1', 'Back Squat', 0),
    ]);

    await getRoutineById('routine-1', {
      routineRepository: createRepository([routine]),
    });

    expect(routine.exercises.map((exercise) => exercise.name)).toEqual([
      'Leg Press',
      'Back Squat',
    ]);
  });
});
