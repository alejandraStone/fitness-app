import { describe, expect, it } from '@jest/globals';

import type {
  DateOnly,
  RoutineAssignment,
  SchedulingRepository,
} from '../../domain/routines';
import { listRoutineAssignments } from './list-routine-assignments';

function createSchedulingRepository(
  assignments: RoutineAssignment[],
): SchedulingRepository & { requestedRoutineIds: string[] } {
  const requestedRoutineIds: string[] = [];

  return {
    requestedRoutineIds,
    async findAssignment(): Promise<RoutineAssignment | null> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsByDate(): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsByRoutine(
      routineId: string,
    ): Promise<RoutineAssignment[]> {
      requestedRoutineIds.push(routineId);
      return assignments.filter(
        (assignment) => assignment.routineId === routineId,
      );
    },
    async findAssignmentsInRange(
      _startDate: DateOnly,
      _endDate: DateOnly,
    ): Promise<RoutineAssignment[]> {
      throw new Error('Not used in this test.');
    },
    async createAssignment(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async deleteAssignment(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('listRoutineAssignments', () => {
  it('returns the one-time dates of the requested routine', async () => {
    const repository = createSchedulingRepository([
      { id: 'a-1', routineId: 'routine-1', date: '2026-10-19' },
      { id: 'b-1', routineId: 'routine-2', date: '2026-10-20' },
      { id: 'a-2', routineId: 'routine-1', date: '2026-10-26' },
    ]);

    await expect(
      listRoutineAssignments('routine-1', {
        schedulingRepository: repository,
      }),
    ).resolves.toEqual([
      { id: 'a-1', routineId: 'routine-1', date: '2026-10-19' },
      { id: 'a-2', routineId: 'routine-1', date: '2026-10-26' },
    ]);
    expect(repository.requestedRoutineIds).toEqual(['routine-1']);
  });

  it('returns an empty list when the routine has no one-time dates', async () => {
    const repository = createSchedulingRepository([]);

    await expect(
      listRoutineAssignments('routine-1', {
        schedulingRepository: repository,
      }),
    ).resolves.toEqual([]);
  });
});
