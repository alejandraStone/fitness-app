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
 * Using local getters preserves the date the user sees on their device instead
 * of shifting to the previous or next day in another time zone.
 */
export function todayDateOnly(now: Date = new Date()): DateOnly {
  return formatDateOnly({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

/** Returns the calendar month containing a date-only value. */
export function monthOfDateOnly(date: DateOnly): CalendarMonth {
  const parsed = parseDateOnly(date);
  if (parsed === null) {
    throw new Error('Invalid date-only value.');
  }

  return { year: parsed.year, month: parsed.month };
}
