import {
  validateWorkoutPerformance,
  type ValidatedWorkoutPerformance,
  type Workout,
  type WorkoutExerciseSnapshot,
  type WorkoutRecordingContext,
  type WorkoutValidationResult,
} from '../../domain/workouts';

/**
 * Raw text values for one planned set while the user is editing.
 *
 * Values stay as text until the form is submitted, so partial input such as
 * `7.` or an empty field never mutates the workout draft prematurely.
 */
export interface WorkoutSetFormValues {
  weightKg: string;
  reps: string;
}

/** Raw text values for one planned exercise, aligned with snapshot order. */
export interface WorkoutExerciseFormValues {
  sets: WorkoutSetFormValues[];
}

/** Raw text values for every planned exercise, aligned with snapshot order. */
export type WorkoutFormValues = WorkoutExerciseFormValues[];

/**
 * Creates the initial recording values from the captured snapshot.
 *
 * Actual weight starts from the planned weight and repetitions start empty.
 * The routine configuration is only read here; it is never updated by the
 * recording form.
 */
export function createRecordingFormValues(
  context: WorkoutRecordingContext,
): WorkoutFormValues {
  return context.exercises.map((exercise) => ({
    sets: Array.from({ length: exercise.plannedSets }, () => ({
      weightKg: String(exercise.plannedWeightKg),
      reps: '',
    })),
  }));
}

/**
 * Rebuilds the immutable recording context from a saved workout snapshot.
 *
 * Editing uses the persisted planned configuration rather than the current
 * routine, so a changed or deleted source routine cannot alter the form.
 */
export function createEditingContext(
  workout: Workout,
): WorkoutRecordingContext {
  return {
    routineId: workout.routineId,
    date: workout.date,
    routineNameSnapshot: workout.routineNameSnapshot,
    exercises: workout.exercises.map((exercise) => {
      const snapshot: WorkoutExerciseSnapshot = {
        nameSnapshot: exercise.nameSnapshot,
        order: exercise.order,
        plannedSets: exercise.plannedSets,
        plannedRepsMin: exercise.plannedRepsMin,
        plannedRepsMax: exercise.plannedRepsMax,
        plannedWeightKg: exercise.plannedWeightKg,
      };

      if (exercise.notesSnapshot !== undefined) {
        snapshot.notesSnapshot = exercise.notesSnapshot;
      }

      return snapshot;
    }),
  };
}

/**
 * Creates the initial editing values from the saved actual performance.
 *
 * Actual weights and repetitions are shown as text so the user can correct
 * them without changing any snapshot field.
 */
export function createEditingFormValues(workout: Workout): WorkoutFormValues {
  return workout.exercises.map((exercise) => ({
    sets: exercise.sets.map((set) => ({
      weightKg: String(set.weightKg),
      reps: String(set.reps),
    })),
  }));
}

/**
 * Converts the workout form text into actual-performance values and validates
 * them against the captured snapshot.
 *
 * The domain validator remains the single owner of the authoritative rules and
 * field paths. Empty values become `undefined` and non-numeric values become
 * `NaN`, so the domain rejects them explicitly. Empty repetitions are never
 * converted to zero.
 */
export function validateWorkoutFormValues(
  context: WorkoutRecordingContext,
  values: WorkoutFormValues,
): WorkoutValidationResult<ValidatedWorkoutPerformance> {
  return validateWorkoutPerformance(
    context,
    values.map((exercise) => ({
      sets: exercise.sets.map((set) => ({
        weightKg: toOptionalNumber(set.weightKg),
        reps: toOptionalNumber(set.reps),
      })),
    })),
  );
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : Number(trimmed);
}
