import {
  isoWeekdayOf,
  parseDateOnly,
  type DateOnly,
} from '../../domain/routines';
import { WEEKDAY_OPTIONS } from '../routine/format';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/** Formats a calendar month as `octubre de 2026`. */
export function formatMonthYear(year: number, month: number): string {
  const monthName = MONTH_NAMES[month - 1];
  if (monthName === undefined) {
    throw new Error('Invalid calendar month.');
  }

  return `${monthName} de ${year}`;
}

/** Formats a date as `lunes, 19 de octubre`. */
export function formatLongDate(date: DateOnly): string {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return `${WEEKDAY_OPTIONS[isoWeekdayOf(date) - 1].long}, ${parsed.day} de ${
    MONTH_NAMES[parsed.month - 1]
  }`;
}

/** Formats a date as `lunes, 19 de octubre de 2026`. */
export function formatFullDate(date: DateOnly): string {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return `${formatLongDate(date)} de ${parsed.year}`;
}
