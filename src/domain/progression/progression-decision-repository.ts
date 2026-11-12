/**
 * Persistence port for explicit progression decisions.
 *
 * Only keep-weight decisions are persisted. Pending recommendations remain
 * derived from saved workouts, the current routine and these decisions.
 */

import type { Timestamp } from '../routines';
import type { WorkoutExerciseId, WorkoutId } from '../workouts';

export interface ProgressionDecisionRepository {
  /** Returns the workout exercises with a keep-weight decision in one workout. */
  findKeepWeightDecisionIds(
    workoutId: WorkoutId,
  ): Promise<WorkoutExerciseId[]>;

  /**
   * Persists a keep-weight decision for one workout exercise.
   *
   * Repeating the same decision must not create a second row or replace the
   * original decision timestamp.
   */
  saveKeepWeightDecision(
    workoutExerciseId: WorkoutExerciseId,
    decidedAt: Timestamp,
  ): Promise<void>;
}
