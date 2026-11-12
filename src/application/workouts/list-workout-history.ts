/**
 * Loads every saved-workout summary for Workout History.
 *
 * Scheduled routines are never part of this result because it reads only the
 * saved-workout repository. Ordering is guaranteed by the application layer.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-09 and AC-11;
 * `specs/002-workout-records/plan.md` §2.2.
 */

import type { WorkoutRepository, WorkoutSummary } from '../../domain/workouts';
import {
  workoutLoadFailedError,
  type WorkoutError,
} from './workout-errors';
import { orderWorkoutSummaries } from './workout-summary-order';

/** External dependencies required to list workout history. */
export interface ListWorkoutHistoryDependencies {
  workoutRepository: WorkoutRepository;
}

/** Outcome of listing all saved workouts. */
export type ListWorkoutHistoryResult =
  | { ok: true; summaries: WorkoutSummary[] }
  | { ok: false; errors: WorkoutError[] };

/**
 * Returns saved-workout summaries newest first.
 *
 * An empty database is a successful empty list. Read failures are translated
 * into a recoverable Spanish application error.
 */
export async function listWorkoutHistory(
  dependencies: ListWorkoutHistoryDependencies,
): Promise<ListWorkoutHistoryResult> {
  try {
    const summaries = await dependencies.workoutRepository.findSummaries();
    return { ok: true, summaries: orderWorkoutSummaries(summaries) };
  } catch {
    return {
      ok: false,
      errors: [
        workoutLoadFailedError(
          'No se pudieron cargar los entrenamientos. Inténtalo de nuevo.',
        ),
      ],
    };
  }
}
