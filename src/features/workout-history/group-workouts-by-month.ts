/**
 * Presentation helper that groups saved-workout summaries by calendar month.
 *
 * The newest month and the newest workout inside each month come first. Dates
 * are date-only values, so grouping never depends on the device time zone.
 */

import { formatMonthYear } from '../../entities/calendar/format';
import { parseDateOnly, type DateOnly } from '../../domain/routines';
import type { WorkoutSummary } from '../../domain/workouts';
import { orderWorkoutSummaries } from '../../application/workouts/workout-summary-order';

/** One month heading with its saved workouts. */
export interface WorkoutMonthGroup {
  /** Stable `YYYY-MM` key. */
  key: string;
  year: number;
  month: number;
  /** Spanish month and year, for example `noviembre de 2026`. */
  title: string;
  summaries: WorkoutSummary[];
}

/**
 * Groups summaries by month, newest month first and newest workout first
 * inside each group.
 */
export function groupWorkoutsByMonth(
  summaries: readonly WorkoutSummary[],
): WorkoutMonthGroup[] {
  const groups: WorkoutMonthGroup[] = [];
  const groupsByKey = new Map<string, WorkoutMonthGroup>();

  for (const summary of orderWorkoutSummaries(summaries)) {
    const parsed = parseDateOnly(summary.date);
    if (parsed === null) {
      throw new Error('Invalid workout date-only value.');
    }

    const key = monthKey(summary.date);
    let group = groupsByKey.get(key);
    if (group === undefined) {
      group = {
        key,
        year: parsed.year,
        month: parsed.month,
        title: formatMonthYear(parsed.year, parsed.month),
        summaries: [],
      };
      groupsByKey.set(key, group);
      groups.push(group);
    }

    group.summaries.push(summary);
  }

  return groups;
}

function monthKey(date: DateOnly): string {
  return date.slice(0, 7);
}
