/**
 * Loads the complete historical record of a saved workout.
 *
 * The workout is read from its persisted snapshot and remains available after
 * the source routine is edited or deleted. Persistence failures are translated
 * into application errors so the presentation layer never sees SQLite details.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-07 and AC-09;
 * `specs/002-workout-records/plan.md` §2.2.
 */

import type { Workout, WorkoutId, WorkoutRepository } from '../../domain/workouts';
import {
  workoutLoadFailedError,
  workoutNotFoundError,
  type WorkoutError,
} from './workout-errors';

/** External dependencies required to read a saved workout. */
export interface GetWorkoutDetailDependencies {
  workoutRepository: WorkoutRepository;
}

/** Outcome of loading one saved workout. */
export type GetWorkoutDetailResult =
  | { ok: true; workout: Workout }
  | { ok: false; errors: WorkoutError[] };

/**
 * Returns the saved workout with its ordered exercises and actual sets.
 *
 * A missing workout is reported as a stable not-found result. Unexpected read
 * failures become a recoverable application error.
 */
export async function getWorkoutDetail(
  workoutId: WorkoutId,
  dependencies: GetWorkoutDetailDependencies,
): Promise<GetWorkoutDetailResult> {
  try {
    const workout = await dependencies.workoutRepository.findById(workoutId);
    if (workout === null) {
      return { ok: false, errors: [workoutNotFoundError()] };
    }

    return { ok: true, workout };
  } catch {
    return { ok: false, errors: [workoutLoadFailedError()] };
  }
}
