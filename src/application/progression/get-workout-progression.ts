/**
 * Loads the pending progression recommendations for one saved workout.
 *
 * Recommendations are derived from every saved workout, the current source
 * routine and the persisted keep-weight decisions. A deleted routine is not an
 * error: it simply produces no recommendations.
 *
 * Requirements: `specs/003-progression/spec.md` FR-01 to FR-06;
 * `specs/003-progression/plan.md` §2.2.
 */

import {
  findPendingRecommendations,
  type ProgressionDecisionRepository,
  type ProgressionRecommendation,
} from '../../domain/progression';
import type { RoutineRepository } from '../../domain/routines';
import type { WorkoutId, WorkoutRepository } from '../../domain/workouts';
import {
  progressionLoadFailedError,
  type ProgressionError,
} from './progression-errors';

/** External dependencies required to evaluate pending recommendations. */
export interface GetWorkoutProgressionDependencies {
  workoutRepository: WorkoutRepository;
  routineRepository: RoutineRepository;
  progressionDecisionRepository: ProgressionDecisionRepository;
}

/** Outcome of evaluating progression recommendations for one workout. */
export type GetWorkoutProgressionResult =
  | { ok: true; recommendations: ProgressionRecommendation[] }
  | { ok: false; errors: ProgressionError[] };

/**
 * Returns the pending recommendations for the displayed workout.
 *
 * The workout is located inside the complete saved-workout collection so the
 * latest-session rule has all the data it needs. Read failures are translated
 * into a recoverable application error without exposing storage details.
 */
export async function getWorkoutProgression(
  workoutId: WorkoutId,
  dependencies: GetWorkoutProgressionDependencies,
): Promise<GetWorkoutProgressionResult> {
  try {
    const workouts = await dependencies.workoutRepository.findAll();
    const workout = workouts.find((candidate) => candidate.id === workoutId);
    if (workout === undefined) {
      return { ok: false, errors: [progressionLoadFailedError()] };
    }

    const routine = await dependencies.routineRepository.findById(
      workout.routineId,
    );
    const decisionIds =
      await dependencies.progressionDecisionRepository.findKeepWeightDecisionIds(
        workout.id,
      );

    return {
      ok: true,
      recommendations: findPendingRecommendations({
        workout,
        workouts,
        routine,
        keepWeightDecisionIds: new Set(decisionIds),
      }),
    };
  } catch {
    return { ok: false, errors: [progressionLoadFailedError()] };
  }
}
