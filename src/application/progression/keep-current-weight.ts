/**
 * Persists the user's decision to keep the current planned weight.
 *
 * The decision is keyed by the stable workout exercise identifier. Repeated
 * submissions are idempotent and never create a second row.
 *
 * Requirements: `specs/003-progression/spec.md` FR-07 and FR-08;
 * `specs/003-progression/plan.md` §2.2.
 */

import type { ProgressionDecisionRepository } from '../../domain/progression';
import type { Timestamp } from '../../domain/routines';
import type { WorkoutExerciseId } from '../../domain/workouts';
import {
  progressionDecisionFailedError,
  type ProgressionError,
} from './progression-errors';

/** External dependencies required to persist a keep-weight decision. */
export interface KeepCurrentWeightDependencies {
  progressionDecisionRepository: ProgressionDecisionRepository;
  now: () => Timestamp;
}

/** Outcome of persisting a keep-weight decision. */
export type KeepCurrentWeightResult =
  | { ok: true }
  | { ok: false; errors: ProgressionError[] };

/**
 * Stores the keep-weight decision with the current timestamp.
 *
 * Persistence failures return the documented Spanish message and leave the
 * decision unsaved so the user can retry.
 */
export async function keepCurrentWeight(
  workoutExerciseId: WorkoutExerciseId,
  dependencies: KeepCurrentWeightDependencies,
): Promise<KeepCurrentWeightResult> {
  try {
    await dependencies.progressionDecisionRepository.saveKeepWeightDecision(
      workoutExerciseId,
      dependencies.now(),
    );
    return { ok: true };
  } catch {
    return {
      ok: false,
      errors: [progressionDecisionFailedError()],
    };
  }
}
