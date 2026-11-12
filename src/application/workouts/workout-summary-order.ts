/**
 * Deterministic ordering for saved-workout summaries.
 *
 * Application use cases guarantee newest-first results even when a repository
 * implementation returns rows in another order.
 */

import type { WorkoutSummary } from '../../domain/workouts';

/**
 * Returns a new list ordered by workout date descending, then by save
 * timestamp descending, then by identifier ascending as a stable tie-breaker.
 */
export function orderWorkoutSummaries(
  summaries: readonly WorkoutSummary[],
): WorkoutSummary[] {
  return [...summaries].sort(compareSummaries);
}

function compareSummaries(
  left: WorkoutSummary,
  right: WorkoutSummary,
): number {
  if (left.date !== right.date) {
    return left.date < right.date ? 1 : -1;
  }
  if (left.savedAt !== right.savedAt) {
    return left.savedAt < right.savedAt ? 1 : -1;
  }
  if (left.id === right.id) {
    return 0;
  }

  return left.id < right.id ? -1 : 1;
}
