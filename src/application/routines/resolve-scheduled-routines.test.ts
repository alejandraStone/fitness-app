import { describe, expect, it } from '@jest/globals';

import type {
  DateOnly,
  Routine,
  RoutineAssignment,
  RoutineExercise,
  RoutineRepository,
  SchedulingRepository,
} from '../../domain/routines';
import { resolveScheduledRoutineEntries } from './resolve-scheduled-routine-entries';
import { resolveScheduledRoutines } from './resolve-scheduled-routines';

const CREATED = '2026-10-18T08:00:00.000Z';

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
  weekdays: Routine['weekdays'],
  exercises?: RoutineExercise[],
): Routine {
  return {
    id,
    name,
    weekdays,
    exercises: exercises ?? [
      createExercise(id, `exercise-${id}`, 'Back Squat', 0),
    ],
    createdAt: CREATED,
    updatedAt: CREATED,
  };
}

interface InMemoryRoutineRepository extends RoutineRepository {
  findAllCalls: number;
}

function createRoutineRepository(
  routines: Routine[] = [],
): InMemoryRoutineRepository {
  let findAllCalls = 0;

  return {
    get findAllCalls(): number {
      return findAllCalls;
    },
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Routine[]> {
      findAllCalls += 1;
      return routines;
    },
    async findById(id: string): Promise<Routine | null> {
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

interface InMemorySchedulingRepository extends SchedulingRepository {
  findAssignmentsByDateCalls: DateOnly[];
}

function createSchedulingRepository(
  assignments: RoutineAssignment[] = [],
): InMemorySchedulingRepository {
  const findAssignmentsByDateCalls: DateOnly[] = [];

  return {
    findAssignmentsByDateCalls,
    async findAssignment(): Promise<RoutineAssignment | null> {
      throw new Error('Not used in this test.');
    },
    async findAssignmentsByDate(date: DateOnly): Promise<RoutineAssignment[]> {
      findAssignmentsByDateCalls.push(date);
      return assignments.filter((assignment) => assignment.date === date);
    },
    async findAssignmentsByRoutine(
      routineId: string,
    ): Promise<RoutineAssignment[]> {
      return assignments.filter(
        (assignment) => assignment.routineId === routineId,
      );
    },
    async findAssignmentsInRange(
      startDate: DateOnly,
      endDate: DateOnly,
    ): Promise<RoutineAssignment[]> {
      return assignments.filter(
        (assignment) =>
          assignment.date >= startDate && assignment.date <= endDate,
      );
    },
    async createAssignment(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async deleteAssignment(): Promise<boolean> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('resolveScheduledRoutines', () => {
  it('combines recurring and individual assignments without duplicates', async () => {
    const routineA = createRoutine(
      'routine-a',
      'Lower A',
      [1],
      [
        createExercise('routine-a', 'exercise-2', 'Leg Press', 1),
        createExercise('routine-a', 'exercise-1', 'Back Squat', 0),
      ],
    );
    const routineB = createRoutine('routine-b', 'Upper A', [3]);
    const routineC = createRoutine('routine-c', 'Conditioning', []);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-a', routineId: 'routine-a', date: '2026-10-19' },
      { id: 'assignment-c', routineId: 'routine-c', date: '2026-10-19' },
    ];

    const result = await resolveScheduledRoutines('2026-10-19', {
      routineRepository: createRoutineRepository([
        routineA,
        routineB,
        routineC,
      ]),
      schedulingRepository: createSchedulingRepository(assignments),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected schedule resolution to succeed.');
    }

    expect(result.routines.map((routine) => routine.id)).toEqual([
      'routine-a',
      'routine-c',
    ]);
    expect(result.routines[0].exercises.map((exercise) => exercise.name)).toEqual(
      ['Back Squat', 'Leg Press'],
    );
  });

  it('allows different routines to be scheduled on the same date', async () => {
    const routineA = createRoutine('routine-a', 'Lower A', []);
    const routineB = createRoutine('routine-b', 'Upper A', []);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-a', routineId: 'routine-a', date: '2026-10-20' },
      { id: 'assignment-b', routineId: 'routine-b', date: '2026-10-20' },
    ];

    const result = await resolveScheduledRoutines('2026-10-20', {
      routineRepository: createRoutineRepository([routineA, routineB]),
      schedulingRepository: createSchedulingRepository(assignments),
    });

    expect(result.ok && result.routines.map((routine) => routine.id)).toEqual([
      'routine-a',
      'routine-b',
    ]);
  });

  it('includes an individual assignment outside the recurring schedule', async () => {
    const routine = createRoutine('routine-a', 'Lower A', [1]);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-a', routineId: 'routine-a', date: '2026-10-20' },
    ];

    const result = await resolveScheduledRoutines('2026-10-20', {
      routineRepository: createRoutineRepository([routine]),
      schedulingRepository: createSchedulingRepository(assignments),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routines.map((item) => item.id)).toEqual(['routine-a']);
    }
  });

  it('returns an empty list when nothing is scheduled for the date', async () => {
    const result = await resolveScheduledRoutines('2026-10-20', {
      routineRepository: createRoutineRepository([
        createRoutine('routine-a', 'Lower A', [1]),
      ]),
      schedulingRepository: createSchedulingRepository(),
    });

    expect(result).toEqual({ ok: true, routines: [] });
  });

  it('rejects an invalid calendar date before loading schedule data', async () => {
    const routineRepository = createRoutineRepository();
    const schedulingRepository = createSchedulingRepository();

    const result = await resolveScheduledRoutines(
      '2026-02-30' as DateOnly,
      {
        routineRepository,
        schedulingRepository,
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
    expect(routineRepository.findAllCalls).toBe(0);
    expect(schedulingRepository.findAssignmentsByDateCalls).toEqual([]);
  });

  it('resolves scheduling consistently across a month and year boundary', async () => {
    const routineA = createRoutine('routine-a', 'Lower A', [3]);
    const routineB = createRoutine('routine-b', 'Upper A', [4]);
    const routineC = createRoutine('routine-c', 'Conditioning', []);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-c', routineId: 'routine-c', date: '2026-01-01' },
    ];
    const dependencies = {
      routineRepository: createRoutineRepository([
        routineA,
        routineB,
        routineC,
      ]),
      schedulingRepository: createSchedulingRepository(assignments),
    };

    const decemberResult = await resolveScheduledRoutines(
      '2025-12-31',
      dependencies,
    );
    const januaryResult = await resolveScheduledRoutines(
      '2026-01-01',
      dependencies,
    );

    expect(
      decemberResult.ok &&
        decemberResult.routines.map((routine) => routine.id),
    ).toEqual(['routine-a']);
    expect(
      januaryResult.ok && januaryResult.routines.map((routine) => routine.id),
    ).toEqual(['routine-b', 'routine-c']);
  });

  it('ignores assignments whose routine no longer exists', async () => {
    const routine = createRoutine('routine-a', 'Lower A', []);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-ghost', routineId: 'ghost', date: '2026-10-20' },
      { id: 'assignment-a', routineId: 'routine-a', date: '2026-10-20' },
    ];

    const result = await resolveScheduledRoutines('2026-10-20', {
      routineRepository: createRoutineRepository([routine]),
      schedulingRepository: createSchedulingRepository(assignments),
    });

    expect(result.ok && result.routines.map((item) => item.id)).toEqual([
      'routine-a',
    ]);
  });

  it('keeps the recurring and one-time sources for each scheduled entry', async () => {
    const routineA = createRoutine('routine-a', 'Lower A', [1]);
    const routineB = createRoutine('routine-b', 'Upper A', [1]);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-a', routineId: 'routine-a', date: '2026-10-19' },
    ];

    const result = await resolveScheduledRoutineEntries('2026-10-19', {
      routineRepository: createRoutineRepository([routineA, routineB]),
      schedulingRepository: createSchedulingRepository(assignments),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected schedule resolution to succeed.');
    }

    expect(
      result.entries.map((entry) => ({
        id: entry.routine.id,
        recurring: entry.recurring,
        assignment: entry.assignment?.id,
      })),
    ).toEqual([
      { id: 'routine-a', recurring: true, assignment: 'assignment-a' },
      { id: 'routine-b', recurring: true, assignment: undefined },
    ]);
  });
});
