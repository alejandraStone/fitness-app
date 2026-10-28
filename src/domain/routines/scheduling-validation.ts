import type { DateOnly, IsoWeekday } from './models';
import { isValidDateOnly } from './date-only';
import type { ValidationError, ValidationResult } from './validation';

/** Returns whether a value is an ISO weekday (Monday = 1, Sunday = 7). */
export function isIsoWeekday(value: unknown): value is IsoWeekday {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

/**
 * Validates and normalizes recurring weekdays.
 *
 * Duplicate weekdays are removed because the domain model stores an ordered
 * set, and the result is sorted ascending for deterministic persistence and
 * display. An empty list is valid and removes every recurring assignment.
 */
export function validateIsoWeekdays(
  value: unknown,
): ValidationResult<IsoWeekday[]> {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      errors: [
        {
          field: 'weekdays',
          code: 'schedule.weekdays.invalid',
          message: 'Los días deben ser una lista.',
        },
      ],
    };
  }

  const errors: ValidationError[] = [];
  const weekdays: IsoWeekday[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const weekday = value[index];
    if (!isIsoWeekday(weekday)) {
      errors.push({
        field: `weekdays[${index}]`,
        code: 'schedule.weekday.invalid',
        message:
          'El día debe ser un número entero entre 1 (lunes) y 7 (domingo).',
      });
      continue;
    }

    if (!weekdays.includes(weekday)) {
      weekdays.push(weekday);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  weekdays.sort((left, right) => left - right);
  return { ok: true, value: weekdays };
}

/**
 * Validates a strict `YYYY-MM-DD` calendar date.
 *
 * Date-only values are never interpreted through the local time zone.
 */
export function validateDateOnly(value: unknown): ValidationResult<DateOnly> {
  if (!isValidDateOnly(value)) {
    return {
      ok: false,
      errors: [
        {
          field: 'date',
          code: 'schedule.date.invalid',
          message:
            'La fecha debe ser una fecha de calendario válida en formato AAAA-MM-DD.',
        },
      ],
    };
  }

  return { ok: true, value };
}
