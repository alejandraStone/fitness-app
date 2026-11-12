/**
 * Pure progression recommendation rules.
 *
 * A recommendation is based on the saved workout snapshot created when the
 * workout was recorded. It must never be reconstructed from the current
 * routine configuration.
 *
 * Requirements: `specs/003-progression/spec.md` FR-01 to FR-03.
 */

import type { Routine } from '../routines';
import {
  isMoreRecentWorkout,
  normalizeExerciseName,
  type Workout,
  type WorkoutExercise,
  type WorkoutExerciseId,
  type WorkoutSet,
} from '../workouts';
import type { ProgressionRecommendation } from './models';

/** A workout and one of its exercises selected by normalized name. */
export interface LatestExerciseSession {
  workout: Workout;
  exercise: WorkoutExercise;
}

/** Input required to calculate pending recommendations for one workout. */
export interface PendingRecommendationsInput {
  /** Saved workout currently displayed in Workout Detail. */
  workout: Workout;
  /** All saved workouts, used to determine the latest session per exercise name. */
  workouts: readonly Workout[];
  /** Current source routine, or `null` when it was deleted. */
  routine: Routine | null;
  /** Workout exercises with an explicit keep-weight decision. */
  keepWeightDecisionIds: ReadonlySet<WorkoutExerciseId>;
}

/**
 * Returns whether one saved workout exercise reached its repetition target.
 *
 * Every planned set must be present and every set must reach at least the
 * maximum repetition target captured in the snapshot. Exceeding the maximum is
 * valid. Exercises with no planned external weight do not qualify.
 */
export function isQualifyingExercise(exercise: WorkoutExercise): boolean {
  return (
    exercise.plannedWeightKg > 0 &&
    exercise.sets.length === exercise.plannedSets &&
    exercise.sets.every((set) => set.reps >= exercise.plannedRepsMax)
  );
}

/**
 * Selects the latest saved session for every normalized exercise name.
 *
 * Newer workout dates win, then newer save timestamps, then the lower workout
 * identifier. Within one workout, the exercise with the lowest display order
 * wins; equal orders use the lower exercise identifier.
 */
export function selectLatestExerciseSessions(
  workouts: readonly Workout[],
): Map<string, LatestExerciseSession> {
  const latest = new Map<string, LatestExerciseSession>();

  for (const workout of workouts) {
    const exercisesByName = selectWorkoutExercisesByName(workout);
    for (const [normalizedName, exercise] of exercisesByName) {
      const current = latest.get(normalizedName);
      if (
        current === undefined ||
        isMoreRecentWorkout(workout, current.workout)
      ) {
        latest.set(normalizedName, { workout, exercise });
      }
    }
  }

  return latest;
}

/**
 * Returns the pending recommendations for the displayed workout.
 *
 * The displayed exercise must be the latest session for its normalized name,
 * must qualify, must have exactly one matching current routine exercise with
 * the same snapshot planned weight, and must not have a keep-weight decision.
 */
export function findPendingRecommendations(
  input: PendingRecommendationsInput,
): ProgressionRecommendation[] {
  const { workout, workouts, routine, keepWeightDecisionIds } = input;
  if (routine === null) {
    return [];
  }

  const latestSessions = selectLatestExerciseSessions(workouts);
  const recommendations: ProgressionRecommendation[] = [];

  for (const exercise of workout.exercises) {
    const normalizedName = normalizeExerciseName(exercise.nameSnapshot);
    const latest = latestSessions.get(normalizedName);

    if (
      latest === undefined ||
      latest.workout.id !== workout.id ||
      latest.exercise.id !== exercise.id
    ) {
      continue;
    }

    if (!isQualifyingExercise(exercise)) {
      continue;
    }

    const routineMatches = routine.exercises.filter(
      (routineExercise) =>
        normalizeExerciseName(routineExercise.name) === normalizedName,
    );
    if (routineMatches.length !== 1) {
      continue;
    }

    if (routineMatches[0].targetWeightKg !== exercise.plannedWeightKg) {
      continue;
    }

    if (keepWeightDecisionIds.has(exercise.id)) {
      continue;
    }

    recommendations.push({
      workoutExerciseId: exercise.id,
      exerciseName: exercise.nameSnapshot,
      repetitions: orderSets(exercise.sets).map((set) => set.reps),
      plannedRepsMax: exercise.plannedRepsMax,
    });
  }

  return recommendations;
}

function selectWorkoutExercisesByName(
  workout: Workout,
): Map<string, WorkoutExercise> {
  const selected = new Map<string, WorkoutExercise>();

  for (const exercise of workout.exercises) {
    const normalizedName = normalizeExerciseName(exercise.nameSnapshot);
    const current = selected.get(normalizedName);

    if (current === undefined || isEarlierExercise(exercise, current)) {
      selected.set(normalizedName, exercise);
    }
  }

  return selected;
}

function isEarlierExercise(
  candidate: WorkoutExercise,
  current: WorkoutExercise,
): boolean {
  return (
    candidate.order < current.order ||
    (candidate.order === current.order && candidate.id < current.id)
  );
}

function orderSets(sets: readonly WorkoutSet[]): WorkoutSet[] {
  return [...sets].sort(
    (left, right) =>
      left.setNumber - right.setNumber || compareIds(left.id, right.id),
  );
}

function compareIds(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}
