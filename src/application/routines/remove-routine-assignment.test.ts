import { describe, expect, it } from '@jest/globals';

import type {
  RoutineAssignment,
  RoutineAssignmentId,
  SchedulingRepository,
} from '../../domain/routines';
import { removeRoutineAssignment } from './remove-routine-assignment';

interface InMemorySchedulingRepository extends SchedulingRepository {
  deletedIds: RoutineAssignmentId[];
}

function createRepository(deleted: boolean): InMemorySchedulingRepository {
  const deletedIds: RoutineAssignmentId[] = [];

  return {
    deletedIds,
    async findAssignment(): Promise<RoutineAssignment | null> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsByDate(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsByRoutine(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsInRange(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async createAssignment(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async deleteAssignment(id: RoutineAssignmentId): Promise<boolean> {
      deletedIds.push(id);
      return deleted;
    },
  };
}

describe('removeRoutineAssignment', () => {
  it('removes the requested individual-date assignment', async () => {
    const repository = createRepository(true);

    const result = await removeRoutineAssignment('assignment-1', {
      schedulingRepository: repository,
    });

    expect(result).toEqual({ ok: true });
    expect(repository.deletedIds).toEqual(['assignment-1']);
  });

  it('returns a not-found error when the assignment does not exist', async () => {
    const repository = createRepository(false);

    const result = await removeRoutineAssignment('missing-assignment', {
      schedulingRepository: repository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'assignmentId',
          code: 'assignment.notFound',
          message: 'No se encontró la asignación.',
        },
      ],
    });
    expect(repository.deletedIds).toEqual(['missing-assignment']);
  });

  it('propagates persistence failures', async () => {
    let requestedId: RoutineAssignmentId | undefined;
    const repository: SchedulingRepository = {
      async findAssignment(): Promise<RoutineAssignment | null> {
        return null;
      },
      async findAssignmentsByDate(): Promise<RoutineAssignment[]> {
        return [];
      },
      async findAssignmentsByRoutine(): Promise<RoutineAssignment[]> {
        return [];
      },
      async findAssignmentsInRange(): Promise<RoutineAssignment[]> {
        return [];
      },
      async createAssignment(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async deleteAssignment(id: RoutineAssignmentId): Promise<boolean> {
        requestedId = id;
        throw new Error('database unavailable');
      },
    };

    await expect(
      removeRoutineAssignment('assignment-42', {
        schedulingRepository: repository,
      }),
    ).rejects.toThrow('database unavailable');

    expect(requestedId).toBe('assignment-42');
  });
});
