/**
 * Application failures for the Progression module.
 *
 * Messages are written in Spanish because the presentation layer may show
 * them. Codes stay stable for programmatic handling.
 */

/** Stable identifier of a progression use-case failure. */
export type ProgressionErrorCode =
  | 'progression.load.failed'
  | 'progression.decision.failed';

/** One progression failure addressed to an operation target. */
export interface ProgressionError {
  field: string;
  code: ProgressionErrorCode;
  message: string;
}

/** Exact message shown when a keep-weight decision cannot be saved. */
export const PROGRESSION_DECISION_FAILED_MESSAGE =
  'No se pudo guardar tu decisión. Inténtalo de nuevo.';

/** Creates the error returned when recommendations cannot be evaluated. */
export function progressionLoadFailedError(): ProgressionError {
  return {
    field: 'workoutId',
    code: 'progression.load.failed',
    message: 'No se pudieron cargar las recomendaciones.',
  };
}

/** Creates the error returned when a keep-weight decision cannot be saved. */
export function progressionDecisionFailedError(): ProgressionError {
  return {
    field: 'workoutExerciseId',
    code: 'progression.decision.failed',
    message: PROGRESSION_DECISION_FAILED_MESSAGE,
  };
}
