import type { ProgressionRecommendation } from '../../domain/progression';

/** Formats one recommendation row for compact display. */
export function formatRecommendationRow(
  recommendation: ProgressionRecommendation,
): string {
  return `${recommendation.exerciseName} · ${recommendation.repetitions.join(
    ' / ',
  )} (objetivo ${recommendation.plannedRepsMax})`;
}

/** Formats the complete screen-reader label for one recommendation row. */
export function formatRecommendationAccessibilityLabel(
  recommendation: ProgressionRecommendation,
): string {
  return `${recommendation.exerciseName}: ${recommendation.repetitions.join(
    ', ',
  )} repeticiones. Objetivo ${recommendation.plannedRepsMax} repeticiones.`;
}

/** Formats the screen-reader label for one keep-weight action. */
export function formatKeepWeightAccessibilityLabel(
  exerciseName: string,
): string {
  return `Mantener el peso de ${exerciseName}`;
}

/** Screen-reader label for the card-level review action. */
export const REVIEW_WEIGHT_ACCESSIBILITY_LABEL =
  'Revisar el peso planificado en la rutina';
