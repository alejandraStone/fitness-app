/**
 * Prepares a workout recording from the current routine configuration.
 *
 * The resulting context is an immutable snapshot. Previous performances are
 * loaded strictly before the selected date and aligned with the context's
 * exercise order.
 *
 * Requirements: `specs/002-workout-records/spec.md` AC-01, AC-02, AC-07 and
 * AC-08; `specs/002-workout-records/plan.md` §2.2.
 */

import {
  isoWeekdayOf,
  validateDateOnly,
  type DateOnly,
  type RoutineId,
  type RoutineRepository,
  type SchedulingRepository,
} from '../../domain/routines';
import {
  buildWorkoutSnapshot,
  findPreviousExercisePerformance,
  type PreviousExercisePerformance,
  type Workout,
  type WorkoutRecordingContext,
  type WorkoutRepository,
} from '../../domain/workouts';
import {
  workoutDateFutureError,
  workoutRoutineNotFoundError,
  workoutRoutineNotScheduledError,
  type WorkoutError,
} from './workout-errors';

/** Input accepted when preparing a workout recording. */
export interface PrepareWorkoutRecordingInput {
  routineId: RoutineId;
  date: DateOnly;
}

/** External dependencies required to prepare a workout recording. */
export interface PrepareWorkoutRecordingDependencies {
  routineRepository: RoutineRepository;
  schedulingRepository: SchedulingRepository;
  workoutRepository: WorkoutRepository;
  /** Returns the current calendar date without time, for future-date checks. */
  today: () => DateOnly;
}

/** Outcome of preparing a workout recording. */
export type PrepareWorkoutRecordingResult =
  | { ok: true; mode: 'existing'; workout: Workout }
  | {
      ok: true;
      mode: 'record';
      context: WorkoutRecordingContext;
      /** Previous result per exercise, aligned with `context.exercises`. */
      previousPerformances: (PreviousExercisePerformance | null)[];
    }
  | { ok: false; errors: WorkoutError[] };

/**
 * Loads everything needed to start recording a workout for a routine and date.
 *
 * Future dates are rejected before any data is loaded. The routine must still
 * exist and be effectively scheduled through a recurring weekday, a one-time
 * assignment or both. If the pair already has a workout, that saved workout is
 * returned instead of starting a new recording.
 */
export async function prepareWorkoutRecording(
  input: PrepareWorkoutRecordingInput,
  dependencies: PrepareWorkoutRecordingDependencies,
): Promise<PrepareWorkoutRecordingResult> {
  const dateValidation = validateDateOnly(input.date);
  if (!dateValidation.ok) {
    return { ok: false, errors: dateValidation.errors };
  }

  const date = dateValidation.value;
  if (date > dependencies.today()) {
    return { ok: false, errors: [workoutDateFutureError()] };
  }

  const routine = await dependencies.routineRepository.findById(input.routineId);
  if (routine === null) {
    return { ok: false, errors: [workoutRoutineNotFoundError()] };
  }

  const existing = await dependencies.workoutRepository.findByRoutineAndDate(
    routine.id,
    date,
  );
  if (existing !== null) {
    return { ok: true, mode: 'existing', workout: existing };
  }

  const recurring = routine.weekdays.includes(isoWeekdayOf(date));
  if (!recurring) {
    const assignment = await dependencies.schedulingRepository.findAssignment(
      routine.id,
      date,
    );
    if (assignment === null) {
      return { ok: false, errors: [workoutRoutineNotScheduledError()] };
    }
  }

  const context: WorkoutRecordingContext = {
    routineId: routine.id,
    date,
    routineNameSnapshot: routine.name,
    exercises: buildWorkoutSnapshot(routine),
  };
  const candidates =
    await dependencies.workoutRepository.findPreviousPerformanceCandidates(
      date,
    );
  const previousPerformances: (PreviousExercisePerformance | null)[] =
    context.exercises.map((exercise) =>
      findPreviousExercisePerformance(candidates, {
        exerciseName: exercise.nameSnapshot,
        selectedDate: date,
      }),
    );

  return {
    ok: true,
    mode: 'record',
    context,
    previousPerformances,
  };
}
