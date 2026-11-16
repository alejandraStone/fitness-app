import type { ProgressionRecommendation } from '../../domain/progression';
import { formatWeightKg } from '../../entities/routine/format';
import { formatRepCount } from '../../entities/workout/format';

/** Formats the recorded repetitions as a readable Spanish list. */
export function formatRecommendationRepetitions(
  recommendation: ProgressionRecommendation,
): string {
  return formatRepetitionList(recommendation.repetitions);
}

/** Formats the recorded repetitions using the compact `reps` label. */
export function formatRecommendationRepetitionsShort(
  recommendation: ProgressionRecommendation,
): string {
  return formatRepetitionListShort(recommendation.repetitions);
}

/** Formats the compact goal label used by multiple recommendation rows. */
export function formatRecommendationGoalShort(
  recommendation: ProgressionRecommendation,
): string {
  return `meta ${recommendation.plannedRepsMax}`;
}

/** Formats the repetition target captured in the workout snapshot. */
export function formatRecommendationObjective(
  recommendation: ProgressionRecommendation,
): string {
  return `Objetivo: ${formatRepCount(recommendation.plannedRepsMax)} por serie`;
}

/** Formats the complete screen-reader label for one recommendation row. */
export function formatRecommendationAccessibilityLabel(
  recommendation: ProgressionRecommendation,
): string {
  return `${recommendation.exerciseName}. Peso actual: ${formatWeightKg(
    recommendation.plannedWeightKg,
  )}. ${formatRecommendationRepetitions(
    recommendation,
  )}. ${formatRecommendationObjective(
    recommendation,
  )}. Objetivo cumplido.`;
}

/** Formats the screen-reader label that expands or collapses one row. */
export function formatRecommendationToggleAccessibilityLabel(
  recommendation: ProgressionRecommendation,
  expanded: boolean,
): string {
  return `${formatRecommendationAccessibilityLabel(recommendation)} ${
    expanded ? 'Ocultar detalles y acciones.' : 'Mostrar detalles y acciones.'
  }`;
}

/** Formats the screen-reader label for one increase-weight action. */
export function formatIncreaseWeightAccessibilityLabel(
  exerciseName: string,
): string {
  return `Aumentar el peso de ${exerciseName}`;
}

/** Formats the screen-reader label for one keep-weight action. */
export function formatKeepWeightAccessibilityLabel(
  exerciseName: string,
): string {
  return `Mantener el peso de ${exerciseName}`;
}

/** Formats the screen-reader label for one postpone action. */
export function formatDecideLaterAccessibilityLabel(
  exerciseName: string,
): string {
  return `Decidir más tarde el peso de ${exerciseName}`;
}

function formatRepetitionList(repetitions: readonly number[]): string {
  if (repetitions.length === 0) {
    return 'Sin repeticiones';
  }

  if (repetitions.length === 1) {
    return formatRepCount(repetitions[0]);
  }

  return `${repetitions.slice(0, -1).join(', ')} y ${
    repetitions[repetitions.length - 1]
  } repeticiones`;
}

function formatRepetitionListShort(repetitions: readonly number[]): string {
  if (repetitions.length === 0) {
    return 'Sin reps';
  }

  const label = repetitions.length === 1 ? 'rep' : 'reps';
  if (repetitions.length === 1) {
    return `${repetitions[0]} ${label}`;
  }

  return `${repetitions.slice(0, -1).join(', ')} y ${
    repetitions[repetitions.length - 1]
  } ${label}`;
}
