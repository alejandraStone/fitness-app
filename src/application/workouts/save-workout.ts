/**
 * Saves a workout from the immutable recording context and validated actual
 * values.
 *
 * The source routine must still exist. Routine edits after recording began do
 * not change the captured snapshot. The repository persists the workout,
 * exercises and sets in one transaction.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-05, AC-03, AC-05 and
 * AC-07; `specs/002-workout-records/plan.md` §2.2.
 */

import type { RoutineRepository, Timestamp } from '../../domain/routines';
import {
  DuplicateWorkoutError,
  validateWorkoutPerformance,
  type ValidatedWorkoutPerformance,
  type Workout,
  type WorkoutExercise,
  type WorkoutRecordingContext,
  type WorkoutRepository,
} from '../../domain/workouts';
import {
  workoutDuplicateError,
  workoutRoutineDeletedError,
  workoutSaveFailedError,
  type WorkoutError,
} from './workout-errors';

/** Input accepted when saving a recorded workout. */
export interface SaveWorkoutInput {
  /** Immutable snapshot captured when recording began. */
  context: WorkoutRecordingContext;
  /**
   * Actual values aligned with `context.exercises`. The domain validator
   * checks set counts, weights and repetitions and returns Spanish messages.
   */
  actuals: unknown;
}

/** External dependencies required to save a workout. */
export interface SaveWorkoutDependencies {
  routineRepository: RoutineRepository;
  workoutRepository: WorkoutRepository;
  /** Generates stable identifiers for the workout, exercises and sets. */
  generateId: () => string;
  /** Returns the save timestamp in ISO 8601 UTC format. */
  now: () => Timestamp;
}

/** Why a workout save did not complete. */
export type SaveWorkoutFailureReason =
  | 'validation'
  | 'routineDeleted'
  | 'duplicate'
  | 'persistence';

/** Outcome of the workout save use case. */
export type SaveWorkoutResult =
  | { ok: true; workout: Workout }
  | {
      ok: false;
      reason: SaveWorkoutFailureReason;
      errors: WorkoutError[];
    };

/**
 * Validates the recorded actual values and persists the complete workout.
 *
 * Invalid values are rejected before any identifiers, timestamp or persistence
 * work occurs. If the source routine was deleted while recording, the result
 * is a recoverable cancellation and nothing is saved. A duplicate routine/date
 * and unexpected persistence failures are returned as Spanish errors so the
 * draft can remain available for retry.
 */
export async function saveWorkout(
  input: SaveWorkoutInput,
  dependencies: SaveWorkoutDependencies,
): Promise<SaveWorkoutResult> {
  const validation = validateWorkoutPerformance(
    input.context,
    input.actuals,
  );
  if (!validation.ok) {
    return { ok: false, reason: 'validation', errors: validation.errors };
  }

  const routine = await dependencies.routineRepository.findById(
    input.context.routineId,
  );
  if (routine === null) {
    return {
      ok: false,
      reason: 'routineDeleted',
      errors: [workoutRoutineDeletedError()],
    };
  }

  const savedAt = dependencies.now();
  const workout = buildWorkout(
    input.context,
    validation.value,
    dependencies.generateId,
    savedAt,
  );

  try {
    await dependencies.workoutRepository.create(workout);
  } catch (error) {
    if (error instanceof DuplicateWorkoutError) {
      return {
        ok: false,
        reason: 'duplicate',
        errors: [workoutDuplicateError(error.message)],
      };
    }

    return {
      ok: false,
      reason: 'persistence',
      errors: [workoutSaveFailedError()],
    };
  }

  return { ok: true, workout };
}

function buildWorkout(
  context: WorkoutRecordingContext,
  performance: ValidatedWorkoutPerformance,
  generateId: () => string,
  savedAt: Timestamp,
): Workout {
  return {
    id: generateId(),
    routineId: context.routineId,
    date: context.date,
    routineNameSnapshot: context.routineNameSnapshot,
    savedAt,
    exercises: context.exercises.map((snapshot, exerciseIndex) => {
      const exercise: WorkoutExercise = {
        id: generateId(),
        nameSnapshot: snapshot.nameSnapshot,
        order: snapshot.order,
        plannedSets: snapshot.plannedSets,
        plannedRepsMin: snapshot.plannedRepsMin,
        plannedRepsMax: snapshot.plannedRepsMax,
        plannedWeightKg: snapshot.plannedWeightKg,
        sets: performance[exerciseIndex].sets.map((set) => ({
          id: generateId(),
          setNumber: set.setNumber,
          weightKg: set.weightKg,
          reps: set.reps,
        })),
      };

      if (snapshot.notesSnapshot !== undefined) {
        exercise.notesSnapshot = snapshot.notesSnapshot;
      }

      return exercise;
    }),
  };
}
