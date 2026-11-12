import {
  formatDateOnly,
  isoWeekdayOf,
  listMonthDates,
  parseDateOnly,
  type CalendarMonth,
  type DateOnly,
} from '../../domain/routines';

/** A fixed six-week grid keeps month navigation from shifting the layout. */
export const CALENDAR_GRID_CELLS = 42;

/** Builds a Monday-first calendar grid with blanks around the month dates. */
export function buildCalendarGrid(
  year: number,
  month: number,
): (DateOnly | null)[] {
  const firstDate = formatDateOnly({ year, month, day: 1 });
  const leadingBlanks = isoWeekdayOf(firstDate) - 1;
  const cells: (DateOnly | null)[] = Array.from(
    { length: leadingBlanks },
    () => null,
  );

  cells.push(...listMonthDates(year, month));

  while (cells.length < CALENDAR_GRID_CELLS) {
    cells.push(null);
  }

  return cells;
}

/**
 * Returns the device's current local calendar date as a date-only value.
 *
 * Kept as a re-export so existing screen imports remain stable; the canonical
 * implementation lives in the routines domain for non-UI callers.
 */
export { todayDateOnly } from '../../domain/routines';

/** Returns the calendar month containing a date-only value. */
export function monthOfDateOnly(date: DateOnly): CalendarMonth {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return { year: parsed.year, month: parsed.month };
}
