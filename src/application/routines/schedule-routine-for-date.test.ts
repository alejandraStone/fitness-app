import { describe, expect, it, jest } from '@jest/globals';

import type {
  DateOnly,
  IsoWeekday,
  Routine,
  RoutineAssignment,
  RoutineAssignmentId,
  RoutineId,
  RoutineRepository,
  SchedulingRepository,
} from '../../domain/routines';
import { scheduleRoutineForDate } from './schedule-routine-for-date';

const CREATED = '2026-10-18T08:00:00.000Z';
const NOW = '2026-10-19T12:00:00.000Z';

function createRoutine(
  id = 'routine-1',
  weekdays: Routine['weekdays'] = [],
): Routine {
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
      const index = routines.findIndex((routine) => routine.id === updated.id);
      if (index >= 0) {
        routines[index] = updated;
      }
    },
    async delete(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

interface InMemorySchedulingRepository extends SchedulingRepository {
  created: RoutineAssignment[];
  findAssignmentCalls: { routineId: RoutineId; date: DateOnly }[];
}

function createSchedulingRepository(
  assignments: RoutineAssignment[] = [],
): InMemorySchedulingRepository {
  const stored = [...assignments];
  const created: RoutineAssignment[] = [];
  const findAssignmentCalls: {
    routineId: RoutineId;
    date: DateOnly;
  }[] = [];

  return {
    created,
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
      return stored.some((assignment) => assignment.id === id);
    },
  };
}

function createDependencies(
  routines: Routine[],
  assignments: RoutineAssignment[] = [],
) {
  const routineRepository = createRoutineRepository(routines);
  const schedulingRepository = createSchedulingRepository(assignments);

  return {
    routineRepository,
    schedulingRepository,
    generateId: () => 'assignment-1',
    now: () => NOW,
  };
}

describe('scheduleRoutineForDate', () => {
  it('adds a routine only to the selected date', async () => {
    const routine = createRoutine('routine-1', [1]);
    const dependencies = createDependencies([routine]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-20',
        mode: 'single',
      },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      mode: 'single',
      assignment: {
        id: 'assignment-1',
        routineId: 'routine-1',
        date: '2026-10-20',
      },
    });
    expect(dependencies.routineRepository.updates).toEqual([]);
    expect(dependencies.schedulingRepository.created).toHaveLength(1);
  });

  it('returns an existing one-time assignment without creating a duplicate', async () => {
    const routine = createRoutine('routine-1', []);
    const existing: RoutineAssignment = {
      id: 'assignment-existing',
      routineId: 'routine-1',
      date: '2026-10-20',
    };
    const dependencies = createDependencies([routine], [existing]);
    const generateId = jest.fn(() => 'assignment-new');
    dependencies.generateId = generateId;

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-20',
        mode: 'single',
      },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      mode: 'single',
      assignment: existing,
    });
    expect(dependencies.schedulingRepository.created).toEqual([]);
    expect(generateId).not.toHaveBeenCalled();
  });

  it('rejects a one-time assignment when the routine already repeats that weekday', async () => {
    const routine = createRoutine('routine-1', [1]);
    const dependencies = createDependencies([routine]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-19',
        mode: 'single',
      },
      dependencies,
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'date',
        code: 'schedule.date.alreadyRecurring',
        message:
          'Esta rutina ya se repite este día. Para añadir otros días, elige la opción de repetición semanal.',
      },
    ]);
    expect(dependencies.schedulingRepository.created).toEqual([]);
  });

  it('adds the selected weekday and additional weekdays without removing existing recurrence', async () => {
    const routine = createRoutine('routine-1', [2]);
    const dependencies = createDependencies([routine]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-21',
        mode: 'recurring',
        weekdays: [1, 3, 5],
      },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      mode: 'recurring',
      routine: {
        ...routine,
        weekdays: [1, 2, 3, 5],
        updatedAt: NOW,
      },
      addedWeekdays: [1, 3, 5],
    });
    expect(dependencies.routineRepository.updates).toEqual([
      {
        ...routine,
        weekdays: [1, 2, 3, 5],
        updatedAt: NOW,
      },
    ]);
    expect(dependencies.schedulingRepository.created).toEqual([]);
  });

  it('does not update the routine when every selected weekday is already scheduled', async () => {
    const routine = createRoutine('routine-1', [1, 3]);
    const dependencies = createDependencies([routine]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-21',
        mode: 'recurring',
        weekdays: [1, 3],
      },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      mode: 'recurring',
      routine,
      addedWeekdays: [],
    });
    expect(dependencies.routineRepository.updates).toEqual([]);
  });

  it('requires the selected date weekday in a recurring schedule', async () => {
    const routine = createRoutine('routine-1', []);
    const dependencies = createDependencies([routine]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-21',
        mode: 'recurring',
        weekdays: [1, 2],
      },
      dependencies,
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'weekdays',
        code: 'schedule.recurrence.dateMissing',
        message: 'La repetición debe incluir el día seleccionado.',
      },
    ]);
    expect(dependencies.routineRepository.updates).toEqual([]);
  });

  it('rejects invalid weekdays before updating the routine', async () => {
    const routine = createRoutine('routine-1', []);
    const dependencies = createDependencies([routine]);
    const invalidWeekdays = [0, 8] as unknown as IsoWeekday[];

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-21',
        mode: 'recurring',
        weekdays: invalidWeekdays,
      },
      dependencies,
    );

    expect(!result.ok && result.errors).toHaveLength(2);
    expect(dependencies.routineRepository.updates).toEqual([]);
  });

  it('rejects an invalid calendar date before loading the routine', async () => {
    const dependencies = createDependencies([createRoutine()]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-02-30' as DateOnly,
        mode: 'single',
      },
      dependencies,
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'date',
        code: 'schedule.date.invalid',
        message:
          'La fecha debe ser una fecha de calendario válida en formato AAAA-MM-DD.',
      },
    ]);
    expect(dependencies.routineRepository.findByIdCalls).toEqual([]);
    expect(dependencies.schedulingRepository.findAssignmentCalls).toEqual([]);
  });

  it('rejects an unknown scheduling mode', async () => {
    const dependencies = createDependencies([createRoutine()]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'routine-1',
        date: '2026-10-21',
        mode: 'weekly' as 'single',
      },
      dependencies,
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'mode',
        code: 'schedule.mode.invalid',
        message: 'La forma de planificación no es válida.',
      },
    ]);
    expect(dependencies.routineRepository.findByIdCalls).toEqual([]);
  });

  it('returns a not-found error for an unknown routine', async () => {
    const dependencies = createDependencies([]);

    const result = await scheduleRoutineForDate(
      {
        routineId: 'missing-routine',
        date: '2026-10-21',
        mode: 'single',
      },
      dependencies,
    );

    expect(!result.ok && result.errors).toEqual([
      {
        field: 'routineId',
        code: 'routine.notFound',
        message: 'No se encontró la rutina.',
      },
    ]);
  });

  it('propagates persistence failures when updating recurring days', async () => {
    const routine = createRoutine('routine-1', []);
    const routineRepository: RoutineRepository = {
      async create(): Promise<void> {
        throw new Error('Not used in this test.');
      },
      async findAll(): Promise<Routine[]> {
        return [routine];
      },
      async findById(): Promise<Routine | null> {
        return routine;
      },
      async update(): Promise<void> {
        throw new Error('database unavailable');
      },
      async delete(): Promise<boolean> {
        throw new Error('Not used in this test.');
      },
    };

    await expect(
      scheduleRoutineForDate(
        {
          routineId: 'routine-1',
          date: '2026-10-21',
          mode: 'recurring',
          weekdays: [3],
        },
        {
          routineRepository,
          schedulingRepository: createSchedulingRepository(),
          generateId: () => 'assignment-1',
          now: () => NOW,
        },
      ),
    ).rejects.toThrow('database unavailable');
  });
});
