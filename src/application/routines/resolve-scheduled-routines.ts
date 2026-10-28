import type { DateOnly, Routine } from '../../domain/routines';
import {
  resolveScheduledRoutineEntries,
  type ResolveScheduledRoutineEntriesDependencies,
} from './resolve-scheduled-routine-entries';
import type { SchedulingError } from './scheduling-errors';

/** External dependencies required to resolve scheduled routines. */
export type ResolveScheduledRoutinesDependencies =
  ResolveScheduledRoutineEntriesDependencies;

/** Outcome of resolving the routines scheduled for a date. */
export type ResolveScheduledRoutinesResult =
  | { ok: true; routines: Routine[] }
  | { ok: false; errors: SchedulingError[] };

/**
 * Resolves the effective routines scheduled for one calendar date.
 *
 * Recurring weekday assignments and individual-date assignments are combined.
 * Each routine appears at most once, while different routines may share the
 * same date. Exercise entries are returned in their configured order.
 */
export async function resolveScheduledRoutines(
  date: DateOnly,
  dependencies: ResolveScheduledRoutinesDependencies,
): Promise<ResolveScheduledRoutinesResult> {
  const result = await resolveScheduledRoutineEntries(date, dependencies);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    routines: result.entries.map((entry) => entry.routine),
  };
}
