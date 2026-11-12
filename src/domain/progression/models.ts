/**
 * Domain models for the Progression module.
 *
 * Recommendations are derived values. They are never persisted as duplicated
 * recommendation records.
 *
 * Requirements: `specs/003-progression/spec.md` FR-01 to FR-04.
 */

import type { WorkoutExerciseId } from '../workouts';

/**
 * One pending recommendation for a saved workout exercise.
 *
 * The recommendation is calculated from the historical workout snapshot and
 * the actual recorded repetitions. It never changes the current routine.
 */
export interface ProgressionRecommendation {
  /** Stable identifier of the workout exercise that produced the recommendation. */
  workoutExerciseId: WorkoutExerciseId;
  /** Exercise name captured in the saved workout snapshot. */
  exerciseName: string;
  /** Actual repetitions in ascending set-number order. */
  repetitions: number[];
  /** Maximum repetition target captured in the saved workout snapshot. */
  plannedRepsMax: number;
}
