import {
  validateIsoWeekdays,
  type IsoWeekday,
  type Routine,
  type RoutineId,
  type RoutineRepository,
  type Timestamp,
} from '../../domain/routines';
import {
  routineNotFoundError,
  type SchedulingError,
} from './scheduling-errors';

/** External dependencies required to update recurring weekdays. */
export interface SetRoutineWeekdaysDependencies {
  routineRepository: RoutineRepository;
  /** Returns the current UTC timestamp in ISO 8601 format. */
  now: () => Timestamp;
}

/** Outcome of replacing a routine's recurring weekdays. */
export type SetRoutineWeekdaysResult =
  | { ok: true; routine: Routine }
  | { ok: false; errors: SchedulingError[] };

/**
 * Replaces the recurring weekdays assigned to a routine.
 *
 * Weekdays are validated, deduplicated and sorted. An empty list removes all
 * recurring assignments. Individual-date assignments and historical workouts
 * are not part of this operation.
 */
export async function setRoutineWeekdays(
  routineId: RoutineId,
  weekdays: readonly IsoWeekday[],
  dependencies: SetRoutineWeekdaysDependencies,
): Promise<SetRoutineWeekdaysResult> {
  const validation = validateIsoWeekdays(weekdays);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const routine = await dependencies.routineRepository.findById(routineId);
  if (routine === null) {
    return { ok: false, errors: [routineNotFoundError()] };
  }

  const updated: Routine = {
    ...routine,
    weekdays: validation.value,
    updatedAt: dependencies.now(),
  };

  await dependencies.routineRepository.update(updated);

  return { ok: true, routine: updated };
}
