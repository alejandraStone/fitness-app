import type { DateOnly, IsoWeekday } from './models';

/**
 * Calendar date components without time or time zone.
 * `month` is 1-based (January = 1).
 */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a strict `YYYY-MM-DD` value into calendar components.
 *
 * Returns `null` for malformed strings and impossible dates such as
 * `2026-02-29`. No local-time conversion is performed.
 */
export function parseDateOnly(value: unknown): CalendarDate | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = DATE_ONLY_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    return null;
  }

  return { year, month, day };
}

/**
 * Serializes calendar components into a strict `YYYY-MM-DD` value.
 *
 * Throws when the components do not represent a real calendar date.
 */
export function formatDateOnly(value: CalendarDate): DateOnly {
  if (!isValidCalendarDate(value.year, value.month, value.day)) {
    throw new Error('Invalid calendar date.');
  }

  return `${pad(value.year, 4)}-${pad(value.month, 2)}-${pad(value.day, 2)}`;
}

/** Returns whether a value is a valid `YYYY-MM-DD` calendar date. */
export function isValidDateOnly(value: unknown): value is DateOnly {
  return parseDateOnly(value) !== null;
}

/** Calendar month components. `month` is 1-based (January = 1). */
export interface CalendarMonth {
  year: number;
  month: number;
}

/**
 * Returns the number of days in a calendar month.
 *
 * Throws when the year or month is outside the supported calendar range.
 */
export function daysInMonth(year: number, month: number): number {
  assertValidMonth(year, month);

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}

/**
 * Moves a calendar month by a whole number of months.
 *
 * Handles year boundaries and throws when the result is outside the supported
 * `0000`–`9999` range.
 */
export function shiftMonth(
  year: number,
  month: number,
  offset: number,
): CalendarMonth {
  assertValidMonth(year, month);
  if (!Number.isInteger(offset)) {
    throw new Error('Month offset must be an integer.');
  }

  const totalMonths = year * 12 + (month - 1) + offset;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonthIndex = totalMonths - nextYear * 12;

  if (nextYear < 0 || nextYear > 9999) {
    throw new Error('Resulting year is outside the supported range.');
  }

  return { year: nextYear, month: nextMonthIndex + 1 };
}

/** Returns the first date of the month containing `date`. */
export function startOfMonth(date: DateOnly): DateOnly {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return formatDateOnly({ year: parsed.year, month: parsed.month, day: 1 });
}

/** Returns the last date of the month containing `date`. */
export function endOfMonth(date: DateOnly): DateOnly {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return formatDateOnly({
    year: parsed.year,
    month: parsed.month,
    day: daysInMonth(parsed.year, parsed.month),
  });
}

/** Returns every date in a calendar month in ascending order. */
export function listMonthDates(year: number, month: number): DateOnly[] {
  const dayCount = daysInMonth(year, month);
  return Array.from({ length: dayCount }, (_, index) =>
    formatDateOnly({ year, month, day: index + 1 }),
  );
}

/**
 * Moves a date to the same day in another month, clamped to the target
 * month's last day (for example January 31 → February 28).
 */
export function moveDateToMonth(
  date: DateOnly,
  year: number,
  month: number,
): DateOnly {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return formatDateOnly({
    year,
    month,
    day: Math.min(parsed.day, daysInMonth(year, month)),
  });
}

function assertValidMonth(year: number, month: number): void {
  if (
    !Number.isInteger(year) ||
    year < 0 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error('Invalid calendar month.');
  }
}

/**
 * Returns the ISO weekday (Monday = 1, Sunday = 7) for a calendar date.
 *
 * Calendar components are evaluated in UTC so the result cannot shift with
 * the device's local time zone.
 */
export function isoWeekdayOf(value: DateOnly): IsoWeekday {
  const parsed = parseDateOnly(value);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  const date = createUtcDate(parsed.year, parsed.month, parsed.day);
  const dayOfWeek = date.getUTCDay();
  return (dayOfWeek === 0 ? 7 : dayOfWeek) as IsoWeekday;
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (
    !Number.isInteger(year) ||
    year < 0 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = createUtcDate(year, month, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function createUtcDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
