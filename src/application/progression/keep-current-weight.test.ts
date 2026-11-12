import { describe, expect, it } from '@jest/globals';

import type { ProgressionDecisionRepository } from '../../domain/progression';
import type { Timestamp } from '../../domain/routines';
import type { WorkoutExerciseId } from '../../domain/workouts';
import { keepCurrentWeight } from './keep-current-weight';

const DECIDED_AT = '2026-11-12T09:30:00.000Z';

interface SavedDecision {
  workoutExerciseId: WorkoutExerciseId;
  decidedAt: Timestamp;
}

interface InMemoryDecisionRepository extends ProgressionDecisionRepository {
  saved: SavedDecision[];
}

function createRepository(error?: Error): InMemoryDecisionRepository {
  const saved: SavedDecision[] = [];

  return {
    saved,
    async findKeepWeightDecisionIds(): Promise<WorkoutExerciseId[]> {
      throw new Error('Not used in this test.');
    },
    async saveKeepWeightDecision(
      workoutExerciseId: WorkoutExerciseId,
      decidedAt: Timestamp,
    ): Promise<void> {
      if (error !== undefined) {
        throw error;
      }
      saved.push({ workoutExerciseId, decidedAt });
    },
  };
}

describe('keepCurrentWeight', () => {
  it('persists the decision with the current timestamp', async () => {
    const repository = createRepository();

    const result = await keepCurrentWeight('workout-exercise-1', {
      progressionDecisionRepository: repository,
      now: () => DECIDED_AT,
    });

    expect(result).toEqual({ ok: true });
    expect(repository.saved).toEqual([
      {
        workoutExerciseId: 'workout-exercise-1',
        decidedAt: DECIDED_AT,
      },
    ]);
  });

  it('returns the exact recoverable message when persistence fails', async () => {
    const repository = createRepository(new Error('SQLITE_IOERR'));

    const result = await keepCurrentWeight('workout-exercise-1', {
      progressionDecisionRepository: repository,
      now: () => DECIDED_AT,
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'workoutExerciseId',
          code: 'progression.decision.failed',
          message: 'No se pudo guardar tu decisión. Inténtalo de nuevo.',
        },
      ],
    });
    expect(repository.saved).toEqual([]);
  });
});
