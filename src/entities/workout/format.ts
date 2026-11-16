import type { DateOnly } from '../../domain/routines';
import type { WorkoutSet, WorkoutSummary } from '../../domain/workouts';
import { formatFullDate } from '../calendar/format';
import {
  formatRepRange,
  formatSetCount,
  formatWeightKg,
} from '../routine/format';

/** Formats a saved workout date as `lunes, 2 de noviembre de 2026`. */
export function formatWorkoutDate(date: DateOnly): string {
  return formatFullDate(date);
}

/** Formats an exercise count with the correct singular or plural noun. */
export function formatExerciseCount(count: number): string {
  return `${count} ${count === 1 ? 'ejercicio' : 'ejercicios'}`;
}

/** Formats a recorded repetition count with the correct Spanish noun. */
export function formatRepCount(count: number): string {
  return formatRepRange(count, count);
}

/** Formats one recorded set as `80 kg · 8 repeticiones`. */
export function formatSetPerformance(weightKg: number, reps: number): string {
  return `${formatWeightKg(weightKg)} · ${formatRepCount(reps)}`;
}

/**
 * Formats the actual weight used across one exercise.
 *
 * A uniform weight is summarized directly; different weights stay explicit in
 * the expanded set rows.
 */
export function formatExerciseUsedWeight(
  sets: readonly WorkoutSet[],
): string {
  if (sets.length === 0) {
    return 'Sin peso registrado';
  }

  const firstWeight = sets[0].weightKg;
  return sets.every((set) => set.weightKg === firstWeight)
    ? formatWeightKg(firstWeight)
    : 'Varios pesos';
}

/** Formats the concise history summary `N ejercicios · N series`. */
export function formatWorkoutHistorySummary(
  summary: Pick<WorkoutSummary, 'exerciseCount' | 'totalSets'>,
): string {
  return `${formatExerciseCount(summary.exerciseCount)} · ${formatSetCount(
    summary.totalSets,
  )}`;
}

/** Formats the monthly Home activity count as `N entrenamientos guardados en ...`. */
export function formatWorkoutActivityCount(
  count: number,
  monthLabel: string,
): string {
  return `${count} ${
    count === 1 ? 'entrenamiento guardado' : 'entrenamientos guardados'
  } en ${monthLabel}`;
}
