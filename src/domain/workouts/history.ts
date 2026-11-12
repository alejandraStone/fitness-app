/**
 * Historical workout rules: exercise-name matching, previous performance and
 * saved-workout summaries.
 *
 * These rules are pure and independent of React Native and SQLite. They use the
 * saved workout snapshot only, never the current routine configuration.
 *
 * Requirements: `specs/002-workout-records/spec.md` FR-04, FR-07 and FR-10.
 */

import type { DateOnly } from '../routines';
import type {
  PreviousExercisePerformance,
  Workout,
  WorkoutExercise,
  WorkoutId,
  WorkoutSummary,
} from './models';

/** Parameters used to find the previous result of one exercise. */
export interface PreviousPerformanceQuery {
  /** Exercise name used for matching; surrounding whitespace and case are ignored. */
  exerciseName: string;
  /** Selected workout date. Only strictly earlier workouts are considered. */
  selectedDate: DateOnly;
  /** Workout being edited; it must not be considered as its own previous result. */
  excludeWorkoutId?: WorkoutId;
}

/**
 * Normalizes an exercise name for historical matching.
 *
 * Leading and trailing whitespace is removed, Unicode composition is
 * normalized to NFC and comparison becomes case-insensitive. Exercise identity
 * in V1 is based on this user-defined name; names are not global identifiers.
 */
export function normalizeExerciseName(name: string): string {
  return name.trim().normalize('NFC').toLowerCase();
}

/**
 * Returns the most recent saved result for an exercise.
 *
 * Matching uses normalized exercise names across all workouts. Only workouts
 * strictly before `selectedDate` are considered. The latest workout date wins;
 * ties are resolved by the latest `savedAt` and then by workout identifier in
 * ascending order so the result is deterministic. When an exercise name appears
 * more than once inside a workout, the entry with the lowest display order is
 * used.
 */
export function findPreviousExercisePerformance(
  workouts: readonly Workout[],
  query: PreviousPerformanceQuery,
): PreviousExercisePerformance | null {
  const normalizedName = normalizeExerciseName(query.exerciseName);
  let selected: { workout: Workout; exercise: WorkoutExercise } | null = null;

  for (const workout of workouts) {
    if (workout.date >= query.selectedDate) {
      continue;
    }
    if (workout.id === query.excludeWorkoutId) {
      continue;
    }

    const exercise = findMatchingExercise(workout, normalizedName);
    if (exercise === null) {
      continue;
    }

    if (
      selected === null ||
      isMoreRecentWorkout(workout, selected.workout)
    ) {
      selected = { workout, exercise };
    }
  }

  if (selected === null) {
    return null;
  }

  return {
    workoutId: selected.workout.id,
    date: selected.workout.date,
    sets: selected.exercise.sets.map((set) => ({
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
    })),
  };
}

/**
 * Calculates the saved-workout summary used by Home and Workout History.
 *
 * Counts come from actual saved exercises and sets, never from planned targets
 * or scheduled routines.
 */
export function summarizeWorkout(workout: Workout): WorkoutSummary {
  let totalSets = 0;
  let totalReps = 0;

  for (const exercise of workout.exercises) {
    totalSets += exercise.sets.length;
    for (const set of exercise.sets) {
      totalReps += set.reps;
    }
  }

  return {
    id: workout.id,
    routineId: workout.routineId,
    date: workout.date,
    routineNameSnapshot: workout.routineNameSnapshot,
    savedAt: workout.savedAt,
    exerciseCount: workout.exercises.length,
    totalSets,
    totalReps,
  };
}

function findMatchingExercise(
  workout: Workout,
  normalizedName: string,
): WorkoutExercise | null {
  let selected: WorkoutExercise | null = null;

  for (const exercise of workout.exercises) {
    if (normalizeExerciseName(exercise.nameSnapshot) !== normalizedName) {
      continue;
    }

    if (
      selected === null ||
      exercise.order < selected.order ||
      (exercise.order === selected.order && exercise.id < selected.id)
    ) {
      selected = exercise;
    }
  }

  return selected;
}

export function isMoreRecentWorkout(
  candidate: Workout,
  current: Workout,
): boolean {
  if (candidate.date !== current.date) {
    return candidate.date > current.date;
  }
  if (candidate.savedAt !== current.savedAt) {
    return candidate.savedAt > current.savedAt;
  }

  return candidate.id < current.id;
}
