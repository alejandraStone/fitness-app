import { describe, expect, it } from '@jest/globals';

import type { DateOnly } from '../../domain/routines';
import type {
  Workout,
  WorkoutRepository,
  WorkoutSummary,
} from '../../domain/workouts';
import { listWorkoutsByMonth } from './list-workouts-by-month';

interface DateRangeCall {
  startDate: DateOnly;
  endDateExclusive: DateOnly;
}

function createSummary(
  overrides: Partial<WorkoutSummary> = {},
): WorkoutSummary {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-01-15',
    routineNameSnapshot: 'Lower A',
    savedAt: '2026-01-15T18:00:00.000Z',
    exerciseCount: 2,
    totalSets: 4,
    totalReps: 28,
    ...overrides,
  };
}

interface InMemoryWorkoutRepository extends WorkoutRepository {
  dateRangeCalls: DateRangeCall[];
}

function createRepository(
  summaries: WorkoutSummary[] = [],
  error?: Error,
): InMemoryWorkoutRepository {
  const dateRangeCalls: DateRangeCall[] = [];

  return {
    dateRangeCalls,
    async create(): Promise<void> {
      throw new Error('Not used in this test.');
    },
    async findAll(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async findById(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findByRoutineAndDate(): Promise<Workout | null> {
      throw new Error('Not used in this test.');
    },
    async findSummaries(): Promise<WorkoutSummary[]> {
      throw new Error('Not used in this test.');
    },
    async findSummariesByDateRange(
      startDate: DateOnly,
      endDateExclusive: DateOnly,
    ): Promise<WorkoutSummary[]> {
      dateRangeCalls.push({ startDate, endDateExclusive });
      if (error !== undefined) {
        throw error;
      }
      return summaries.filter(
        (summary) =>
          summary.date >= startDate && summary.date < endDateExclusive,
      );
    },
    async findPreviousPerformanceCandidates(): Promise<Workout[]> {
      throw new Error('Not used in this test.');
    },
    async updateActualSets(): Promise<void> {
      throw new Error('Not used in this test.');
    },
  };
}

describe('listWorkoutsByMonth', () => {
  it('includes both month boundaries, excludes adjacent months and orders newest first', async () => {
    const firstDay = createSummary({
      id: 'workout-first',
      date: '2026-01-01',
      savedAt: '2026-01-01T18:00:00.000Z',
    });
    const lastDay = createSummary({
      id: 'workout-last',
      date: '2026-01-31',
      savedAt: '2026-01-31T18:00:00.000Z',
    });
    const previousMonth = createSummary({
      id: 'workout-previous',
      date: '2025-12-31',
      savedAt: '2025-12-31T18:00:00.000Z',
    });
    const nextMonth = createSummary({
      id: 'workout-next',
      date: '2026-02-01',
      savedAt: '2026-02-01T18:00:00.000Z',
    });
    const repository = createRepository([
      firstDay,
      lastDay,
      previousMonth,
      nextMonth,
    ]);

    const result = await listWorkoutsByMonth('2026-01-15', {
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: true,
      summaries: [lastDay, firstDay],
    });
    expect(repository.dateRangeCalls).toEqual([
      { startDate: '2026-01-01', endDateExclusive: '2026-02-01' },
    ]);
  });

  it('rolls the exclusive end date into the next year for December', async () => {
    const repository = createRepository();

    const result = await listWorkoutsByMonth('2026-12-20', {
      workoutRepository: repository,
    });

    expect(result).toEqual({ ok: true, summaries: [] });
    expect(repository.dateRangeCalls).toEqual([
      { startDate: '2026-12-01', endDateExclusive: '2027-01-01' },
    ]);
  });

  it('rejects invalid month input before reading persistence', async () => {
    const repository = createRepository();

    const result = await listWorkoutsByMonth('2026-13-01', {
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'month',
          code: 'workout.month.invalid',
          message: 'El mes indicado no es válido.',
        },
      ],
    });
    expect(repository.dateRangeCalls).toEqual([]);
  });

  it('returns an empty list when the month has no saved workouts', async () => {
    const repository = createRepository([
      createSummary({ date: '2026-03-10' }),
    ]);

    const result = await listWorkoutsByMonth('2026-02-10', {
      workoutRepository: repository,
    });

    expect(result).toEqual({ ok: true, summaries: [] });
  });

  it('translates persistence failures into a recoverable Spanish error', async () => {
    const repository = createRepository(
      [],
      new Error('SQLITE_IOERR: read failed'),
    );

    const result = await listWorkoutsByMonth('2026-02-10', {
      workoutRepository: repository,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workout',
          code: 'workout.load.failed',
          message:
            'No se pudo cargar la actividad del mes. Inténtalo de nuevo.',
        },
      ],
    });
  });
});
