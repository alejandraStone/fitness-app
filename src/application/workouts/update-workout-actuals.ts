/**
 * Updates only the actual weights and repetitions of a saved workout.
 *
 * Every structural field is compared against the persisted workout before any
 * value is written. The complete set of actual values is validated with the
 * same domain rules used while recording, and the repository performs the
 * update in one transaction.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-08 and AC-10;
 * `specs/002-workout-records/plan.md` §2.2.
 */

import {
  validateWorkoutPerformance,
  type ValidatedWorkoutPerformance,
  type Workout,
  type WorkoutExercise,
  type WorkoutRecordingContext,
  type WorkoutRepository,
} from '../../domain/workouts';
import {
  workoutLoadFailedError,
  workoutNotFoundError,
  workoutStructureChangedError,
  workoutUpdateFailedError,
  type WorkoutError,
} from './workout-errors';

/** Input accepted when updating the actual values of a saved workout. */
export interface UpdateWorkoutActualsInput {
  /**
   * Saved workout with the requested actual weights and repetitions. Every
   * snapshot field must match the persisted workout.
   */
  workout: Workout;
}

/** External dependencies required to update a saved workout. */
export interface UpdateWorkoutActualsDependencies {
  workoutRepository: WorkoutRepository;
}

/** Why a workout actual-value update did not complete. */
export type UpdateWorkoutActualsFailureReason =
  | 'notFound'
  | 'structure'
  | 'validation'
  | 'persistence';

/** Outcome of updating the actual values of a saved workout. */
export type UpdateWorkoutActualsResult =
  | { ok: true; workout: Workout }
  | {
      ok: false;
      reason: UpdateWorkoutActualsFailureReason;
      errors: WorkoutError[];
    };

/**
 * Validates and persists changes to actual weights and repetitions.
 *
 * The persisted workout is loaded first so date, routine snapshot, exercise
 * identity and order, planned configuration and set identity cannot change
 * through the edit path. Invalid actual values are rejected before the
 * repository is called.
 */
export async function updateWorkoutActuals(
  input: UpdateWorkoutActualsInput,
  dependencies: UpdateWorkoutActualsDependencies,
): Promise<UpdateWorkoutActualsResult> {
  let existing: Workout | null;
  try {
    existing = await dependencies.workoutRepository.findById(input.workout.id);
  } catch {
    return {
      ok: false,
      reason: 'persistence',
      errors: [workoutLoadFailedError()],
    };
  }

  if (existing === null) {
    return { ok: false, reason: 'notFound', errors: [workoutNotFoundError()] };
  }

  const changedField = findStructuralChange(input.workout, existing);
  if (changedField !== null) {
    return {
      ok: false,
      reason: 'structure',
      errors: [workoutStructureChangedError(changedField)],
    };
  }

  const validation = validateWorkoutPerformance(
    toRecordingContext(existing),
    toActualValues(input.workout),
  );
  if (!validation.ok) {
    return {
      ok: false,
      reason: 'validation',
      errors: validation.errors,
    };
  }

  const updated = applyActualValues(existing, validation.value);

  try {
    await dependencies.workoutRepository.updateActualSets(updated);
  } catch {
    return {
      ok: false,
      reason: 'persistence',
      errors: [workoutUpdateFailedError()],
    };
  }

  return { ok: true, workout: updated };
}

function toRecordingContext(workout: Workout): WorkoutRecordingContext {
  return {
    routineId: workout.routineId,
    date: workout.date,
    routineNameSnapshot: workout.routineNameSnapshot,
    exercises: workout.exercises.map((exercise) => {
      const snapshot: WorkoutRecordingContext['exercises'][number] = {
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

function toActualValues(workout: Workout): unknown[] {
  return workout.exercises.map((exercise) => ({
    sets: exercise.sets.map((set) => ({
      weightKg: set.weightKg,
      reps: set.reps,
    })),
  }));
}

function applyActualValues(
  workout: Workout,
  performance: ValidatedWorkoutPerformance,
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise, exerciseIndex) => {
      const validatedExercise = performance[exerciseIndex];
      const updated: WorkoutExercise = {
        ...exercise,
        sets: exercise.sets.map((set, setIndex) => ({
          ...set,
          weightKg: validatedExercise.sets[setIndex].weightKg,
          reps: validatedExercise.sets[setIndex].reps,
        })),
      };

      return updated;
    }),
  };
}

function findStructuralChange(
  candidate: Workout,
  existing: Workout,
): string | null {
  if (candidate.id !== existing.id) {
    return 'id';
  }
  if (candidate.routineId !== existing.routineId) {
    return 'routineId';
  }
  if (candidate.date !== existing.date) {
    return 'date';
  }
  if (candidate.routineNameSnapshot !== existing.routineNameSnapshot) {
    return 'routineNameSnapshot';
  }
  if (candidate.savedAt !== existing.savedAt) {
    return 'savedAt';
  }
  if (candidate.exercises.length !== existing.exercises.length) {
    return 'exercises';
  }

  for (let exerciseIndex = 0; exerciseIndex < existing.exercises.length; exerciseIndex += 1) {
    const fieldPrefix = `exercises[${exerciseIndex}]`;
    const candidateExercise = candidate.exercises[exerciseIndex];
    const existingExercise = existing.exercises[exerciseIndex];

    if (candidateExercise.id !== existingExercise.id) {
      return `${fieldPrefix}.id`;
    }
    if (candidateExercise.nameSnapshot !== existingExercise.nameSnapshot) {
      return `${fieldPrefix}.nameSnapshot`;
    }
    if (candidateExercise.order !== existingExercise.order) {
      return `${fieldPrefix}.order`;
    }
    if (candidateExercise.plannedSets !== existingExercise.plannedSets) {
      return `${fieldPrefix}.plannedSets`;
    }
    if (candidateExercise.plannedRepsMin !== existingExercise.plannedRepsMin) {
      return `${fieldPrefix}.plannedRepsMin`;
    }
    if (candidateExercise.plannedRepsMax !== existingExercise.plannedRepsMax) {
      return `${fieldPrefix}.plannedRepsMax`;
    }
    if (candidateExercise.plannedWeightKg !== existingExercise.plannedWeightKg) {
      return `${fieldPrefix}.plannedWeightKg`;
    }
    if (candidateExercise.notesSnapshot !== existingExercise.notesSnapshot) {
      return `${fieldPrefix}.notesSnapshot`;
    }
    if (candidateExercise.sets.length !== existingExercise.sets.length) {
      return `${fieldPrefix}.sets`;
    }

    for (let setIndex = 0; setIndex < existingExercise.sets.length; setIndex += 1) {
      const candidateSet = candidateExercise.sets[setIndex];
      const existingSet = existingExercise.sets[setIndex];
      const setFieldPrefix = `${fieldPrefix}.sets[${setIndex}]`;

      if (candidateSet.id !== existingSet.id) {
        return `${setFieldPrefix}.id`;
      }
      if (candidateSet.setNumber !== existingSet.setNumber) {
        return `${setFieldPrefix}.setNumber`;
      }
    }
  }

  return null;
}
