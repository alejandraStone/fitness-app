import type { RoutineExercise } from '../../domain/routines';

/** Planned totals displayed at the top of a routine's summary. */
export interface RoutineSummary {
  exerciseCount: number;
  totalSets: number;
  /**
   * Planned repetitions calculated with each exercise's minimum target.
   *
   * A single conservative number keeps the summary compact while the exercise
   * rows continue to show the full repetition range.
   */
  totalReps: number;
}

/** Calculates the planned exercise, set and repetition totals of a routine. */
export function summarizeRoutine(
  exercises: readonly RoutineExercise[],
): RoutineSummary {
  return exercises.reduce<RoutineSummary>(
    (summary, exercise) => ({
      exerciseCount: summary.exerciseCount + 1,
      totalSets: summary.totalSets + exercise.targetSets,
      totalReps:
        summary.totalReps + exercise.targetSets * exercise.targetRepsMin,
    }),
    { exerciseCount: 0, totalSets: 0, totalReps: 0 },
  );
}
