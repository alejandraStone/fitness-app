import {
  isoWeekdayOf,
  type DateOnly,
  type Routine,
  type RoutineAssignment,
  type RoutineId,
} from '../../domain/routines';
import { orderRoutineExercises } from './routine-ordering';

/** One effective routine scheduled for a date and the reasons it appears. */
export interface ScheduledRoutineEntry {
  routine: Routine;
  /** Whether the routine's recurring weekday matches this date. */
  recurring: boolean;
  /**
   * The individual-date assignment for this routine and date, when one exists.
   * A recurring routine may also have a one-time assignment for the same date.
   */
  assignment?: RoutineAssignment;
}

/**
 * Combines recurring weekdays and individual-date assignments for one date.
 *
 * Each routine appears at most once. Recurring matches keep the routine
 * repository order; individual assignments then follow in assignment order.
 * Exercise entries are returned in their configured order.
 */
export function resolveScheduledRoutinesForDate(
  date: DateOnly,
  routines: readonly Routine[],
  assignments: readonly RoutineAssignment[],
): ScheduledRoutineEntry[] {
  const weekday = isoWeekdayOf(date);
  const routinesById = new Map<RoutineId, Routine>(
    routines.map((routine) => [routine.id, routine]),
  );
  const assignmentsByRoutine = new Map<RoutineId, RoutineAssignment>(
    assignments.map((assignment) => [assignment.routineId, assignment]),
  );
  const includedIds = new Set<RoutineId>();
  const scheduled: ScheduledRoutineEntry[] = [];

  for (const routine of routines) {
    const recurring = routine.weekdays.includes(weekday);
    const assignment = assignmentsByRoutine.get(routine.id);

    if (!recurring && assignment === undefined) {
      continue;
    }

    includedIds.add(routine.id);
    const entry: ScheduledRoutineEntry = {
      routine: orderRoutineExercises(routine),
      recurring,
    };
    if (assignment !== undefined) {
      entry.assignment = assignment;
    }
    scheduled.push(entry);
  }

  for (const assignment of assignments) {
    if (includedIds.has(assignment.routineId)) {
      continue;
    }

    const routine = routinesById.get(assignment.routineId);
    if (routine === undefined) {
      continue;
    }

    includedIds.add(routine.id);
    scheduled.push({
      routine: orderRoutineExercises(routine),
      recurring: false,
      assignment,
    });
  }

  return scheduled;
}
