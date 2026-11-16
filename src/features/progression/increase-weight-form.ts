import { formatWeightKg } from '../../entities/routine/format';

/** Outcome of validating the manually entered next weight. */
export type IncreasedWeightValidation =
  | { ok: true; weightKg: number }
  | { ok: false; message: string };

/**
 * Validates the weight entered by the user.
 *
 * The application never suggests an increment, so the input starts empty and
 * the user must enter a finite value strictly above the current weight.
 */
export function validateIncreasedWeight(
  value: string,
  currentWeightKg: number,
): IncreasedWeightValidation {
  const trimmed = value.trim();
  if (trimmed === '') {
    return { ok: false, message: 'Introduce el nuevo peso.' };
  }

  const weightKg = Number(trimmed);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return { ok: false, message: 'Introduce un peso válido.' };
  }

  if (weightKg <= currentWeightKg) {
    return {
      ok: false,
      message: `El nuevo peso debe ser mayor que ${formatWeightKg(
        currentWeightKg,
      )}.`,
    };
  }

  return { ok: true, weightKg };
}
