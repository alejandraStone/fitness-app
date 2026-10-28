import {
  validateDateOnly,
  type DateOnly,
  type RoutineRepository,
  type SchedulingRepository,
} from '../../domain/routines';
import { resolveScheduledRoutinesForDate, type ScheduledRoutineEntry } from './schedule-resolution';
import type { SchedulingError } from './scheduling-errors';

/** External dependencies required to resolve scheduled routines. */
export interface ResolveScheduledRoutineEntriesDependencies {
  routineRepository: RoutineRepository;
  schedulingRepository: SchedulingRepository;
}

/** Outcome of resolving the effective routines scheduled for a date. */
export type ResolveScheduledRoutineEntriesResult =
  | { ok: true; entries: ScheduledRoutineEntry[] }
  | { ok: false; errors: SchedulingError[] };

/**
 * Resolves the effective routines scheduled for one calendar date with the
 * scheduling source of each occurrence.
 *
 * The result keeps recurring and individual-date information available to
 * contextual flows without exposing repositories to the presentation layer.
 */
export async function resolveScheduledRoutineEntries(
  date: DateOnly,
  dependencies: ResolveScheduledRoutineEntriesDependencies,
): Promise<ResolveScheduledRoutineEntriesResult> {
  const dateValidation = validateDateOnly(date);
  if (!dateValidation.ok) {
    return { ok: false, errors: dateValidation.errors };
  }

  const [routines, assignments] = await Promise.all([
    dependencies.routineRepository.findAll(),
    dependencies.schedulingRepository.findAssignmentsByDate(
      dateValidation.value,
    ),
  ]);

  return {
    ok: true,
    entries: resolveScheduledRoutinesForDate(
      dateValidation.value,
      routines,
      assignments,
    ),
  };
}
