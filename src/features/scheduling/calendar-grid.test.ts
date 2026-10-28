import { describe, expect, it } from '@jest/globals';

import {
  CALENDAR_GRID_CELLS,
  buildCalendarGrid,
  monthOfDateOnly,
  todayDateOnly,
} from './calendar-grid';

describe('calendar grid', () => {
  it('places month dates after the leading blank cells', () => {
    const cells = buildCalendarGrid(2026, 10);

    expect(cells).toHaveLength(CALENDAR_GRID_CELLS);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toBe('2026-10-01');
    expect(cells[33]).toBe('2026-10-31');
    expect(cells.slice(34)).toEqual(Array(8).fill(null));
  });

  it('handles leap-year February and months starting on Monday', () => {
    const february = buildCalendarGrid(2024, 2);
    expect(february[3]).toBe('2024-02-01');
    expect(february[31]).toBe('2024-02-29');
    expect(february.filter((cell) => cell !== null)).toHaveLength(29);

    const june = buildCalendarGrid(2026, 6);
    expect(june[0]).toBe('2026-06-01');
  });

  it('uses the local calendar date for today', () => {
    expect(todayDateOnly(new Date(2026, 9, 19, 23, 59))).toBe('2026-10-19');
    expect(todayDateOnly(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
  });

  it('derives the calendar month from a date', () => {
    expect(monthOfDateOnly('2026-10-19')).toEqual({ year: 2026, month: 10 });
    expect(() => monthOfDateOnly('2026-02-30' as never)).toThrow(
      'Invalid date-only value.',
    );
  });
});
