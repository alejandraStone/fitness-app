import { describe, expect, it } from '@jest/globals';

import type {
  DateOnly,
  Routine,
  RoutineAssignment,
  RoutineExercise,
  RoutineRepository,
  SchedulingRepository,
} from '../../domain/routines';
import {
  resolveMonthlySchedule,
  type ScheduledDay,
} from './resolve-monthly-schedule';

const CREATED = '2026-10-01T08:00:00.000Z';

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
  weekdays: Routine['weekdays'],
  exercises?: RoutineExercise[],
): Routine {
  return {
    id,
    name: `Routine ${id}`,
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
  findAssignmentsInRangeCalls: { startDate: DateOnly; endDate: DateOnly }[];
}

function createSchedulingRepository(
  assignments: RoutineAssignment[] = [],
): InMemorySchedulingRepository {
  const findAssignmentsInRangeCalls: {
    startDate: DateOnly;
    endDate: DateOnly;
  }[] = [];

  return {
    findAssignmentsInRangeCalls,
    async findAssignment(
      routineId: string,
      date: DateOnly,
    ): Promise<RoutineAssignment | null> {
      return (
        assignments.find(
          (assignment) =>
            assignment.routineId === routineId && assignment.date === date,
        ) ?? null
      );
    },
    async findAssignmentsByDate(date: DateOnly): Promise<RoutineAssignment[]> {
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
      findAssignmentsInRangeCalls.push({ startDate, endDate });
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

function findDay(days: ScheduledDay[], date: DateOnly): ScheduledDay {
  const day = days.find((entry) => entry.date === date);
  if (day === undefined) {
    throw new Error(`Expected ${date} to be scheduled.`);
  }
  return day;
}

describe('resolveMonthlySchedule', () => {
  it('combines recurring and individual assignments for every scheduled day', async () => {
    const routineA = createRoutine('routine-a', [1], [
      createExercise('routine-a', 'exercise-2', 'Leg Press', 1),
      createExercise('routine-a', 'exercise-1', 'Back Squat', 0),
    ]);
    const routineB = createRoutine('routine-b', []);
    const routineC = createRoutine('routine-c', [2]);
    const assignments: RoutineAssignment[] = [
      { id: 'assignment-a', routineId: 'routine-a', date: '2026-10-19' },
      { id: 'assignment-b-19', routineId: 'routine-b', date: '2026-10-19' },
      { id: 'assignment-b-20', routineId: 'routine-b', date: '2026-10-20' },
      { id: 'assignment-outside', routineId: 'routine-b', date: '2026-11-01' },
      { id: 'assignment-ghost', routineId: 'ghost', date: '2026-10-21' },
    ];
    const schedulingRepository = createSchedulingRepository(assignments);

    const result = await resolveMonthlySchedule('2026-10-01', {
      routineRepository: createRoutineRepository([routineA, routineB, routineC]),
      schedulingRepository,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected monthly schedule resolution to succeed.');
    }

    expect(result.days.map((day) => day.date)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-12',
      '2026-10-13',
      '2026-10-19',
      '2026-10-20',
      '2026-10-26',
      '2026-10-27',
    ]);
    expect(schedulingRepository.findAssignmentsInRangeCalls).toEqual([
      { startDate: '2026-10-01', endDate: '2026-10-31' },
    ]);

    const october19 = findDay(result.days, '2026-10-19');
    expect(
      october19.routines.map((entry) => ({
        id: entry.routine.id,
        recurring: entry.recurring,
        assignmentId: entry.assignment?.id,
      })),
    ).toEqual([
      { id: 'routine-a', recurring: true, assignmentId: 'assignment-a' },
      { id: 'routine-b', recurring: false, assignmentId: 'assignment-b-19' },
    ]);
    expect(
      october19.routines[0].routine.exercises.map((exercise) => exercise.name),
    ).toEqual(['Back Squat', 'Leg Press']);

    const october20 = findDay(result.days, '2026-10-20');
    expect(
      october20.routines.map((entry) => ({
        id: entry.routine.id,
        recurring: entry.recurring,
        assignmentId: entry.assignment?.id,
      })),
    ).toEqual([
      { id: 'routine-b', recurring: false, assignmentId: 'assignment-b-20' },
      { id: 'routine-c', recurring: true, assignmentId: undefined },
    ]);
  });

  it('uses the month containing the provided date', async () => {
    const routine = createRoutine('routine-a', [1]);
    const result = await resolveMonthlySchedule('2026-10-19', {
      routineRepository: createRoutineRepository([routine]),
      schedulingRepository: createSchedulingRepository(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.days).toHaveLength(4);
      expect(result.days[0].date).toBe('2026-10-05');
      expect(result.days[3].date).toBe('2026-10-26');
    }
  });

  it('returns no days when nothing is scheduled in the month', async () => {
    const result = await resolveMonthlySchedule('2026-10-01', {
      routineRepository: createRoutineRepository([
        createRoutine('routine-a', []),
      ]),
      schedulingRepository: createSchedulingRepository(),
    });

    expect(result).toEqual({ ok: true, days: [] });
  });

  it('rejects an invalid month before loading schedule data', async () => {
    const routineRepository = createRoutineRepository();
    const schedulingRepository = createSchedulingRepository();

    const result = await resolveMonthlySchedule('2026-02-30' as DateOnly, {
      routineRepository,
      schedulingRepository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'date',
          code: 'schedule.date.invalid',
        message:
          'La fecha debe ser una fecha de calendario válida en formato AAAA-MM-DD.',
        },
      ],
    });
    expect(routineRepository.findAllCalls).toBe(0);
    expect(schedulingRepository.findAssignmentsInRangeCalls).toEqual([]);
  });
});
