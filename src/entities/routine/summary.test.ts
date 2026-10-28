import { describe, expect, it } from '@jest/globals';

import type { RoutineExercise } from '../../domain/routines';
import { summarizeRoutine } from './summary';

function createExercise(
  id: string,
  overrides: Partial<RoutineExercise> = {},
): RoutineExercise {
  return {
    id,
    routineId: 'routine-1',
    name: `Exercise ${id}`,
    order: 0,
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeightKg: 20,
    ...overrides,
  };
}

describe('summarizeRoutine', () => {
  it('returns zero totals for an empty routine', () => {
    expect(summarizeRoutine([])).toEqual({
      exerciseCount: 0,
      totalSets: 0,
      totalReps: 0,
    });
  });

  it('adds exercises, sets and repetitions using the minimum target', () => {
    expect(
      summarizeRoutine([
        createExercise('exercise-1', {
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 12,
        }),
        createExercise('exercise-2', {
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 10,
        }),
      ]),
    ).toEqual({
      exerciseCount: 2,
      totalSets: 7,
      totalReps: 3 * 8 + 4 * 6,
    });
  });
});
