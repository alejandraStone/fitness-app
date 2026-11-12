/**
 * Loads a saved workout together with the previous result of each exercise.
 *
 * The workout being edited is excluded from its own previous-performance
 * search. Matching uses historical exercise-name snapshots and only considers
 * workouts strictly before the saved workout date.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-04, FR-08 and AC-10;
 * `specs/002-workout-records/plan.md` §2.2.
 */

import {
  findPreviousExercisePerformance,
  type PreviousExercisePerformance,
  type Workout,
  type WorkoutId,
  type WorkoutRepository,
} from '../../domain/workouts';
import { getWorkoutDetail } from './get-workout-detail';
import {
  workoutLoadFailedError,
  type WorkoutError,
} from './workout-errors';

/** External dependencies required to load the editing context. */
export interface GetWorkoutEditingContextDependencies {
  workoutRepository: WorkoutRepository;
}

/** Outcome of loading a saved workout for editing. */
export type GetWorkoutEditingContextResult =
  | {
      ok: true;
      workout: Workout;
      /** Previous result per exercise, aligned with `workout.exercises`. */
      previousPerformances: (PreviousExercisePerformance | null)[];
    }
  | { ok: false; errors: WorkoutError[] };

/**
 * Returns the saved workout and the most recent earlier result of every
 * exercise. The edited workout never appears as its own previous result.
 */
export async function getWorkoutEditingContext(
  workoutId: WorkoutId,
  dependencies: GetWorkoutEditingContextDependencies,
): Promise<GetWorkoutEditingContextResult> {
  const detail = await getWorkoutDetail(workoutId, dependencies);
  if (!detail.ok) {
    return detail;
  }

  try {
    const workout = detail.workout;
    const candidates =
      await dependencies.workoutRepository.findPreviousPerformanceCandidates(
        workout.date,
        { excludeWorkoutId: workout.id },
      );
    const previousPerformances: (PreviousExercisePerformance | null)[] =
      workout.exercises.map((exercise) =>
        findPreviousExercisePerformance(candidates, {
          exerciseName: exercise.nameSnapshot,
          selectedDate: workout.date,
          excludeWorkoutId: workout.id,
        }),
      );

    return { ok: true, workout, previousPerformances };
  } catch {
    return { ok: false, errors: [workoutLoadFailedError()] };
  }
}
