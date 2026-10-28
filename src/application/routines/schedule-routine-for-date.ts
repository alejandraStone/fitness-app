import {
  isoWeekdayOf,
  validateDateOnly,
  validateIsoWeekdays,
  type DateOnly,
  type IsoWeekday,
  type Routine,
  type RoutineAssignment,
  type RoutineId,
  type RoutineRepository,
  type SchedulingRepository,
  type Timestamp,
} from '../../domain/routines';
import { assignRoutineToDate } from './assign-routine-to-date';
import {
  routineNotFoundError,
  type SchedulingError,
} from './scheduling-errors';

/** How an existing routine is added to a calendar date. */
export type RoutineScheduleMode = 'single' | 'recurring';

/** Input accepted when scheduling an existing routine for a date. */
export interface ScheduleRoutineForDateInput {
  routineId: RoutineId;
  date: DateOnly;
  /**
   * `single` adds only the selected date. `recurring` adds the selected
   * weekday and any additional weekdays to the routine's weekly schedule.
   */
  mode: RoutineScheduleMode;
  /** Required for `recurring`; ignored for `single`. */
  weekdays?: readonly IsoWeekday[];
}

/** External dependencies required to schedule a routine for a date. */
export interface ScheduleRoutineForDateDependencies {
  routineRepository: RoutineRepository;
  schedulingRepository: SchedulingRepository;
  /** Generates stable identifiers for new one-time assignments. */
  generateId: () => string;
  /** Returns the current UTC timestamp in ISO 8601 format. */
  now: () => Timestamp;
}

/** Outcome of adding an existing routine to a calendar date. */
export type ScheduleRoutineForDateResult =
  | { ok: true; mode: 'single'; assignment: RoutineAssignment }
  | {
      ok: true;
      mode: 'recurring';
      routine: Routine;
      /** Weekdays newly added to the routine's recurring schedule. */
      addedWeekdays: IsoWeekday[];
    }
  | { ok: false; errors: SchedulingError[] };

/**
 * Schedules an existing routine for one date, either only for that date or
 * weekly on that weekday and optionally additional weekdays.
 *
 * The selected date's weekday is always part of a recurring schedule. Existing
 * recurring weekdays and one-time assignments are preserved. Repeating a
 * weekday that is already scheduled is a no-op, so the same routine never
 * gains a duplicate occurrence. No workout record is created.
 */
export async function scheduleRoutineForDate(
  input: ScheduleRoutineForDateInput,
  dependencies: ScheduleRoutineForDateDependencies,
): Promise<ScheduleRoutineForDateResult> {
  const dateValidation = validateDateOnly(input.date);
  if (!dateValidation.ok) {
    return { ok: false, errors: dateValidation.errors };
  }

  if (input.mode !== 'single' && input.mode !== 'recurring') {
    return {
      ok: false,
      errors: [
        {
          field: 'mode',
          code: 'schedule.mode.invalid',
          message: 'La forma de planificación no es válida.',
        },
      ],
    };
  }

  const routine = await dependencies.routineRepository.findById(input.routineId);
  if (routine === null) {
    return { ok: false, errors: [routineNotFoundError()] };
  }

  const date = dateValidation.value;
  if (input.mode === 'single') {
    return scheduleOnlyForDate(routine, date, dependencies);
  }

  const weekdaysValidation = validateIsoWeekdays(input.weekdays);
  if (!weekdaysValidation.ok) {
    return { ok: false, errors: weekdaysValidation.errors };
  }

  const selectedWeekday = isoWeekdayOf(date);
  if (!weekdaysValidation.value.includes(selectedWeekday)) {
    return {
      ok: false,
      errors: [
        {
          field: 'weekdays',
          code: 'schedule.recurrence.dateMissing',
          message: 'La repetición debe incluir el día seleccionado.',
        },
      ],
    };
  }

  return scheduleRecurring(routine, weekdaysValidation.value, dependencies);
}

async function scheduleOnlyForDate(
  routine: Routine,
  date: DateOnly,
  dependencies: ScheduleRoutineForDateDependencies,
): Promise<ScheduleRoutineForDateResult> {
  if (routine.weekdays.includes(isoWeekdayOf(date))) {
    return {
      ok: false,
      errors: [
        {
          field: 'date',
          code: 'schedule.date.alreadyRecurring',
          message:
            'Esta rutina ya se repite este día. Para añadir otros días, elige la opción de repetición semanal.',
        },
      ],
    };
  }

  const assigned = await assignRoutineToDate(
    { routineId: routine.id, date },
    dependencies,
  );

  if (!assigned.ok) {
    return assigned;
  }

  return { ok: true, mode: 'single', assignment: assigned.assignment };
}

async function scheduleRecurring(
  routine: Routine,
  selectedWeekdays: readonly IsoWeekday[],
  dependencies: ScheduleRoutineForDateDependencies,
): Promise<ScheduleRoutineForDateResult> {
  const addedWeekdays = selectedWeekdays.filter(
    (weekday) => !routine.weekdays.includes(weekday),
  );

  if (addedWeekdays.length === 0) {
    return {
      ok: true,
      mode: 'recurring',
      routine,
      addedWeekdays: [],
    };
  }

  const weekdays = Array.from(
    new Set([...routine.weekdays, ...selectedWeekdays]),
  ).sort((left, right) => left - right);

  const updated: Routine = {
    ...routine,
    weekdays,
    updatedAt: dependencies.now(),
  };

  await dependencies.routineRepository.update(updated);

  return {
    ok: true,
    mode: 'recurring',
    routine: updated,
    addedWeekdays,
  };
}
