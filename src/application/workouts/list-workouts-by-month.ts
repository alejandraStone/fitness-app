/**
 * Loads saved-workout summaries for one visible calendar month.
 *
 * The query uses a half-open range from the first day of the month to the first
 * day of the next month, so both month boundaries are included without relying
 * on time zones. Scheduled routines are never part of the result.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-10 and AC-12;
 * `specs/002-workout-records/plan.md` §2.2.
 */

import {
  formatDateOnly,
  parseDateOnly,
  shiftMonth,
  type DateOnly,
} from '../../domain/routines';
import type { WorkoutRepository, WorkoutSummary } from '../../domain/workouts';
import {
  workoutLoadFailedError,
  workoutMonthInvalidError,
  type WorkoutError,
} from './workout-errors';
import { orderWorkoutSummaries } from './workout-summary-order';

/** External dependencies required to list a month of saved workouts. */
export interface ListWorkoutsByMonthDependencies {
  workoutRepository: WorkoutRepository;
}

/** Outcome of listing the saved workouts of one month. */
export type ListWorkoutsByMonthResult =
  | { ok: true; summaries: WorkoutSummary[] }
  | { ok: false; errors: WorkoutError[] };

/**
 * Returns saved-workout summaries whose date belongs to the month containing
 * `monthDate`, newest first.
 *
 * Any valid date inside the month is accepted and normalized to the month
 * range. Invalid input is rejected before reading persistence.
 */
export async function listWorkoutsByMonth(
  monthDate: DateOnly,
  dependencies: ListWorkoutsByMonthDependencies,
): Promise<ListWorkoutsByMonthResult> {
  const parsed = parseDateOnly(monthDate);
  if (parsed === null) {
    return { ok: false, errors: [workoutMonthInvalidError()] };
  }

  const startDate = formatDateOnly({
    year: parsed.year,
    month: parsed.month,
    day: 1,
  });
  const nextMonth = shiftMonth(parsed.year, parsed.month, 1);
  const endDateExclusive = formatDateOnly({
    year: nextMonth.year,
    month: nextMonth.month,
    day: 1,
  });

  try {
    const summaries =
      await dependencies.workoutRepository.findSummariesByDateRange(
        startDate,
        endDateExclusive,
      );
    return { ok: true, summaries: orderWorkoutSummaries(summaries) };
  } catch {
    return {
      ok: false,
      errors: [
        workoutLoadFailedError(
          'No se pudo cargar la actividad del mes. Inténtalo de nuevo.',
        ),
      ],
    };
  }
}
