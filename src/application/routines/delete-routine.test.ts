import { describe, expect, it } from '@jest/globals';

import type { Routine, RoutineId, RoutineRepository } from '../../domain/routines';
import { deleteRoutine } from './delete-routine';

interface InMemoryRoutineRepository extends RoutineRepository {
  deletedIds: RoutineId[];
  historicalWorkouts: string[];
}

function createRepository(deleted: boolean): InMemoryRoutineRepository {
  const deletedIds: RoutineId[] = [];
  const historicalWorkouts = ['workout-1', 'workout-2'];

  return {
    deletedIds,
    historicalWorkouts,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      return [];
    },
    async findById(): Promise<Routine | null> {
      throw new Error('Not used in this test.');
    },
    async update(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async delete(id: RoutineId): Promise<boolean> {
      deletedIds.push(id);
      return deleted;
    },
  };
}

describe('deleteRoutine', () => {
  it('permanently deletes the requested routine and leaves historical data untouched', async () => {
    const repository = createRepository(true);

    const result = await deleteRoutine('routine-1', {
      routineRepository: repository,
    });

    expect(result).toEqual({ ok: true });
    expect(repository.deletedIds).toEqual(['routine-1']);
    expect(repository.historicalWorkouts).toEqual(['workout-1', 'workout-2']);
  });

  it('returns a not-found error when the routine does not exist', async () => {
    const repository = createRepository(false);

    const result = await deleteRoutine('missing-routine', {
      routineRepository: repository,
    });

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
    expect(repository.deletedIds).toEqual(['missing-routine']);
  });

  it('propagates persistence failures', async () => {
    let requestedId: RoutineId | undefined;
    const repository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async findAll(): Promise<Routine[]> {
        return [];
      },
      async findById(): Promise<Routine | null> {
        return null;
      },
      async update(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async delete(id: RoutineId): Promise<boolean> {
        requestedId = id;
        throw new Error('database unavailable');
      },
    };

    await expect(
      deleteRoutine('routine-42', { routineRepository: repository }),
    ).rejects.toThrow('database unavailable');

    expect(requestedId).toBe('routine-42');
  });
});
