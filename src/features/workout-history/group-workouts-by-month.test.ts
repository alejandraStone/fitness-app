import { describe, expect, it } from '@jest/globals';

import type { WorkoutSummary } from '../../domain/workouts';
import { groupWorkoutsByMonth } from './group-workouts-by-month';

function createSummary(
  overrides: Partial<WorkoutSummary> = {},
): WorkoutSummary {
  return {
    id: 'workout-1',
    routineId: 'routine-1',
    date: '2026-11-02',
    routineNameSnapshot: 'Lower A',
    savedAt: '2026-11-02T18:00:00.000Z',
    exerciseCount: 2,
    totalSets: 4,
    totalReps: 28,
    ...overrides,
  };
}

describe('groupWorkoutsByMonth', () => {
  it('orders months and workouts newest first and formats Spanish headings', () => {
    const olderNovember = createSummary({
      id: 'november-early',
      date: '2026-11-02',
      savedAt: '2026-11-02T18:00:00.000Z',
    });
    const newerNovember = createSummary({
      id: 'november-late',
      date: '2026-11-20',
      savedAt: '2026-11-20T18:00:00.000Z',
    });
    const october = createSummary({
      id: 'october',
      date: '2026-10-31',
      savedAt: '2026-10-31T18:00:00.000Z',
    });
    const december = createSummary({
      id: 'december',
      date: '2026-12-01',
      savedAt: '2026-12-01T18:00:00.000Z',
    });

    const groups = groupWorkoutsByMonth([
      olderNovember,
      october,
      newerNovember,
      december,
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      '2026-12',
      '2026-11',
      '2026-10',
    ]);
    expect(groups.map((group) => group.title)).toEqual([
      'diciembre de 2026',
      'noviembre de 2026',
      'octubre de 2026',
    ]);
    expect(groups[1].summaries.map((summary) => summary.id)).toEqual([
      'november-late',
      'november-early',
    ]);
  });

  it('returns no groups for an empty history', () => {
    expect(groupWorkoutsByMonth([])).toEqual([]);
  });
});
