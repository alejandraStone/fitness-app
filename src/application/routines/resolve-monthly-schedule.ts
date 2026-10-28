import {
  endOfMonth,
  listMonthDates,
  parseDateOnly,
  startOfMonth,
  validateDateOnly,
  type DateOnly,
  type RoutineAssignment,
  type RoutineRepository,
  type SchedulingRepository,
} from '../../domain/routines';
import {
  resolveScheduledRoutinesForDate,
  type ScheduledRoutineEntry,
} from './schedule-resolution';
import type { SchedulingError } from './scheduling-errors';

/** External dependencies required to resolve a month of scheduling data. */
export interface ResolveMonthlyScheduleDependencies {
  routineRepository: RoutineRepository;
  schedulingRepository: SchedulingRepository;
}

/** Effective routines scheduled for one date in a month. */
export interface ScheduledDay {
  date: DateOnly;
  routines: ScheduledRoutineEntry[];
}

/** Outcome of resolving one calendar month of scheduled routines. */
export type ResolveMonthlyScheduleResult =
  | { ok: true; days: ScheduledDay[] }
  | { ok: false; errors: SchedulingError[] };

/**
 * Resolves every date in the month containing `monthStart` that has at least
 * one scheduled routine.
 *
 * Recurring weekdays and individual-date assignments are combined with the
 * same rules as the single-date use case. Days without scheduled routines are
 * omitted. Each entry reports whether it came from the recurring schedule, an
 * individual-date assignment, or both.
 */
export async function resolveMonthlySchedule(
  monthStart: DateOnly,
  dependencies: ResolveMonthlyScheduleDependencies,
): Promise<ResolveMonthlyScheduleResult> {
  const monthValidation = validateDateOnly(monthStart);
  if (!monthValidation.ok) {
    return { ok: false, errors: monthValidation.errors };
  }

  const parsed = parseDateOnly(monthValidation.value);
  if (parsed === null) {
    throw new Error('Validated date could not be parsed.');
  }

  const startDate = startOfMonth(monthValidation.value);
  const endDate = endOfMonth(monthValidation.value);

  const [routines, assignments] = await Promise.all([
    dependencies.routineRepository.findAll(),
    dependencies.schedulingRepository.findAssignmentsInRange(
      startDate,
      endDate,
    ),
  ]);

  const assignmentsByDate = new Map<DateOnly, RoutineAssignment[]>();
  for (const assignment of assignments) {
    const dayAssignments = assignmentsByDate.get(assignment.date) ?? [];
    dayAssignments.push(assignment);
    assignmentsByDate.set(assignment.date, dayAssignments);
  }

  const days: ScheduledDay[] = [];
  for (const date of listMonthDates(parsed.year, parsed.month)) {
    const resolved = resolveScheduledRoutinesForDate(
      date,
      routines,
      assignmentsByDate.get(date) ?? [],
    );

    if (resolved.length > 0) {
      days.push({ date, routines: resolved });
    }
  }

  return { ok: true, days };
}
