import { describe, expect, it } from '@jest/globals';

import type {
  Routine,
  RoutineExercise,
  RoutineRepository,
} from '../../domain/routines';
import { listRoutines } from './list-routines';

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
    weekdays: [],
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
    async findById(): Promise<Routine | null> {
      return null;
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('listRoutines', () => {
  it('returns an empty list when no routines exist', async () => {
    await expect(
      listRoutines({ routineRepository: createRepository() }),
    ).resolves.toEqual([]);
  });

  it('returns all existing routines', async () => {
    const routines = [
      createRoutine('routine-1', 'Lower A', [
        createExercise('routine-1', 'exercise-1', 'Back Squat', 0),
      ]),
      createRoutine('routine-2', 'Upper A', [
        createExercise('routine-2', 'exercise-2', 'Bench Press', 0),
      ]),
    ];

    const result = await listRoutines({
      routineRepository: createRepository(routines),
    });

    expect(result.map((routine) => routine.name)).toEqual([
      'Lower A',
      'Upper A',
    ]);
  });

  it('returns exercise entries in their configured order', async () => {
    const routine = createRoutine('routine-1', 'Lower A', [
      createExercise('routine-1', 'exercise-2', 'Leg Press', 1),
      createExercise('routine-1', 'exercise-1', 'Back Squat', 0),
    ]);

    const result = await listRoutines({
      routineRepository: createRepository([routine]),
    });

    expect(result[0].exercises.map((exercise) => exercise.name)).toEqual([
      'Back Squat',
      'Leg Press',
    ]);
    expect(result[0].exercises.map((exercise) => exercise.order)).toEqual([
      0, 1,
    ]);
  });

  it('does not mutate the routines returned by the repository', async () => {
    const routine = createRoutine('routine-1', 'Lower A', [
      createExercise('routine-1', 'exercise-2', 'Leg Press', 1),
      createExercise('routine-1', 'exercise-1', 'Back Squat', 0),
    ]);

    await listRoutines({ routineRepository: createRepository([routine]) });

    expect(routine.exercises.map((exercise) => exercise.name)).toEqual([
      'Leg Press',
      'Back Squat',
    ]);
  });

  it('propagates repository failures', async () => {
    const repository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async findAll(): Promise<Routine[]> {
        throw new Error('database unavailable');
      },
      async findById(): Promise<Routine | null> {
        return null;
      },
      async update(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async delete(): Promise<boolean> {
        throw new Error('Not used in this test.');
      },
    };

    await expect(listRoutines({ routineRepository: repository })).rejects.toThrow(
      'database unavailable',
    );
  });
});
