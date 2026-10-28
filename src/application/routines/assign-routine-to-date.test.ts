import { describe, expect, it, jest } from '@jest/globals';

import type {
  DateOnly,
  Routine,
  RoutineAssignment,
  RoutineAssignmentId,
  RoutineId,
  RoutineRepository,
  SchedulingRepository,
} from '../../domain/routines';
import { assignRoutineToDate } from './assign-routine-to-date';

const CREATED = '2026-10-18T08:00:00.000Z';

function createRoutine(id = 'routine-1', weekdays: Routine['weekdays'] = [1]): Routine {
  return {
    id,
    name: `Routine ${id}`,
    weekdays,
    exercises: [
      {
        id: `exercise-${id}`,
        routineId: id,
        name: 'Back Squat',
        order: 0,
        targetSets: 4,
        targetRepsMin: 6,
        targetRepsMax: 8,
        targetWeightKg: 75,
      },
    ],
    createdAt: CREATED,
    updatedAt: CREATED,
  };
}

interface InMemoryRoutineRepository extends RoutineRepository {
  findByIdCalls: RoutineId[];
  updates: Routine[];
}

function createRoutineRepository(
  routines: Routine[] = [],
): InMemoryRoutineRepository {
  const findByIdCalls: RoutineId[] = [];
  const updates: Routine[] = [];

  return {
    findByIdCalls,
    updates,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      return routines;
    },
    async findById(id: RoutineId): Promise<Routine | null> {
      findByIdCalls.push(id);
      return routines.find((routine) => routine.id === id) ?? null;
    },
    async update(updated: Routine): Promise<void> {
      updates.push(updated);
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

interface InMemorySchedulingRepository extends SchedulingRepository {
  created: RoutineAssignment[];
  deletedIds: RoutineAssignmentId[];
  findAssignmentCalls: { routineId: RoutineId; date: DateOnly }[];
}

function createSchedulingRepository(
  assignments: RoutineAssignment[] = [],
): InMemorySchedulingRepository {
  const stored = [...assignments];
  const created: RoutineAssignment[] = [];
  const deletedIds: RoutineAssignmentId[] = [];
  const findAssignmentCalls: {
    routineId: RoutineId;
    date: DateOnly;
  }[] = [];

  return {
    created,
    deletedIds,
    findAssignmentCalls,
    async findAssignment(
      routineId: RoutineId,
      date: DateOnly,
    ): Promise<RoutineAssignment | null> {
      findAssignmentCalls.push({ routineId, date });
      return (
        stored.find(
          (assignment) =>
            assignment.routineId === routineId && assignment.date === date,
        ) ?? null
      );
    },
    async findAssignmentsByDate(date: DateOnly): Promise<RoutineAssignment[]> {
      return stored.filter((assignment) => assignment.date === date);
    },
    async findAssignmentsByRoutine(
      routineId: RoutineId,
    ): Promise<RoutineAssignment[]> {
      return stored.filter((assignment) => assignment.routineId === routineId);
    },
    async findAssignmentsInRange(
      startDate: DateOnly,
      endDate: DateOnly,
    ): Promise<RoutineAssignment[]> {
      return stored.filter(
        (assignment) =>
          assignment.date >= startDate && assignment.date <= endDate,
      );
    },
    async createAssignment(assignment: RoutineAssignment): Promise<void> {
      created.push(assignment);
      stored.push(assignment);
    },
    async deleteAssignment(id: RoutineAssignmentId): Promise<boolean> {
      deletedIds.push(id);
      return false;
    },
  };
}

describe('assignRoutineToDate', () => {
  it('assigns a routine to a date outside its recurring weekdays', async () => {
    const routine = createRoutine('routine-1', [1]);
    const routineRepository = createRoutineRepository([routine]);
    const schedulingRepository = createSchedulingRepository();

    const result = await assignRoutineToDate(
      { routineId: 'routine-1', date: '2026-12-31' },
      {
        routineRepository,
        schedulingRepository,
        generateId: () => 'assignment-1',
      },
    );

    expect(result).toEqual({
      ok: true,
      assignment: {
        id: 'assignment-1',
        routineId: 'routine-1',
        date: '2026-12-31',
      },
    });
    expect(routine.weekdays).toEqual([1]);
    expect(routineRepository.updates).toEqual([]);
    expect(schedulingRepository.created).toEqual([
      {
        id: 'assignment-1',
        routineId: 'routine-1',
        date: '2026-12-31',
      },
    ]);
    expect(schedulingRepository.findAssignmentCalls).toEqual([
      { routineId: 'routine-1', date: '2026-12-31' },
    ]);
  });

  it('returns the existing assignment without creating a duplicate', async () => {
    const routine = createRoutine();
    const existing: RoutineAssignment = {
      id: 'assignment-existing',
      routineId: 'routine-1',
      date: '2026-12-31',
    };
    const schedulingRepository = createSchedulingRepository([existing]);
    const generateId = jest.fn(() => 'assignment-new');

    const result = await assignRoutineToDate(
      { routineId: 'routine-1', date: '2026-12-31' },
      {
        routineRepository: createRoutineRepository([routine]),
        schedulingRepository,
        generateId,
      },
    );

    expect(result).toEqual({ ok: true, assignment: existing });
    expect(schedulingRepository.created).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('rejects an invalid calendar date before loading the routine', async () => {
    const routineRepository = createRoutineRepository([createRoutine()]);
    const schedulingRepository = createSchedulingRepository();
    const generateId = jest.fn(() => 'assignment-1');

    const result = await assignRoutineToDate(
      { routineId: 'routine-1', date: '2026-02-30' as DateOnly },
      {
        routineRepository,
        schedulingRepository,
        generateId,
      },
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'date',
        code: 'schedule.date.invalid',
        message:
          'La fecha debe ser una fecha de calendario válida en formato AAAA-MM-DD.',
      },
    ]);
    expect(routineRepository.findByIdCalls).toEqual([]);
    expect(schedulingRepository.findAssignmentCalls).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('returns a not-found error for an unknown routine', async () => {
    const scheduler = createSchedulingRepository();
    const generateId = jest.fn(() => 'assignment-1');

    const result = await assignRoutineToDate(
      { routineId: 'missing-routine', date: '2026-12-31' },
      {
        routineRepository: createRoutineRepository(),
        schedulingRepository: scheduler,
        generateId,
      },
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'routineId',
        code: 'routine.notFound',
        message: 'No se encontró la rutina.',
      },
    ]);
    expect(scheduler.findAssignmentCalls).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('allows different routines to be assigned to the same date', async () => {
    const routineA = createRoutine('routine-a', []);
    const routineB = createRoutine('routine-b', []);
    const existing: RoutineAssignment = {
      id: 'assignment-a',
      routineId: 'routine-a',
      date: '2026-12-31',
    };
    const schedulingRepository = createSchedulingRepository([existing]);

    const result = await assignRoutineToDate(
      { routineId: 'routine-b', date: '2026-12-31' },
      {
        routineRepository: createRoutineRepository([routineA, routineB]),
        schedulingRepository,
        generateId: () => 'assignment-b',
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assignment).toEqual({
        id: 'assignment-b',
        routineId: 'routine-b',
        date: '2026-12-31',
      });
    }
    expect(schedulingRepository.created).toHaveLength(1);
  });

  it('propagates persistence failures', async () => {
    const routine = createRoutine();
    const schedulingRepository: SchedulingRepository = {
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
        throw new Error('database unavailable');
      },
      async deleteAssignment(): Promise<boolean> {
        return false;
      },
    };

    await expect(
      assignRoutineToDate(
        { routineId: 'routine-1', date: '2026-12-31' },
        {
          routineRepository: createRoutineRepository([routine]),
          schedulingRepository,
          generateId: () => 'assignment-1',
        },
      ),
    ).rejects.toThrow('database unavailable');
  });
});
