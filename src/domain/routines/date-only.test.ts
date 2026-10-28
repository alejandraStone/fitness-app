import { describe, expect, it } from '@jest/globals';

import {
  daysInMonth,
  endOfMonth,
  formatDateOnly,
  isoWeekdayOf,
  isValidDateOnly,
  listMonthDates,
  moveDateToMonth,
  parseDateOnly,
  shiftMonth,
  startOfMonth,
} from './date-only';

describe('date-only calendar utilities', () => {
  it('parses and serializes month-end and year-end dates without shifting', () => {
    expect(parseDateOnly('2026-01-31')).toEqual({
      year: 2026,
      month: 1,
      day: 31,
    });
    expect(parseDateOnly('2026-12-31')).toEqual({
      year: 2026,
      month: 12,
      day: 31,
    });
    expect(formatDateOnly({ year: 2026, month: 1, day: 31 })).toBe(
      '2026-01-31',
    );
    expect(formatDateOnly({ year: 2026, month: 12, day: 31 })).toBe(
      '2026-12-31',
    );
  });

  it('round-trips calendar components exactly', () => {
    const dates = ['2024-02-29', '2025-12-31', '2026-01-01', '2026-10-19'];

    for (const date of dates) {
      const parsed = parseDateOnly(date);
      expect(parsed).not.toBeNull();
      if (parsed !== null) {
        expect(formatDateOnly(parsed)).toBe(date);
      }
    }
  });

  it('rejects malformed and impossible calendar dates', () => {
    expect(parseDateOnly('2026-02-29')).toBeNull();
    expect(parseDateOnly('2026-13-01')).toBeNull();
    expect(parseDateOnly('2026-00-10')).toBeNull();
    expect(parseDateOnly('2026-01-32')).toBeNull();
    expect(parseDateOnly('2026-1-01')).toBeNull();
    expect(parseDateOnly('2026-01-01T00:00:00.000Z')).toBeNull();
    expect(parseDateOnly('')).toBeNull();
    expect(parseDateOnly(20261019)).toBeNull();
    expect(isValidDateOnly('2026-02-29')).toBe(false);
    expect(isValidDateOnly('2024-02-29')).toBe(true);
  });

  it('calculates ISO weekdays across month, year and leap-day boundaries', () => {
    expect(isoWeekdayOf('2026-10-19')).toBe(1);
    expect(isoWeekdayOf('2026-10-20')).toBe(2);
    expect(isoWeekdayOf('2025-12-31')).toBe(3);
    expect(isoWeekdayOf('2026-01-01')).toBe(4);
    expect(isoWeekdayOf('2026-12-31')).toBe(4);
    expect(isoWeekdayOf('2027-01-01')).toBe(5);
    expect(isoWeekdayOf('2024-02-29')).toBe(4);
    expect(isoWeekdayOf('2024-03-01')).toBe(5);
  });

  it('throws when asked for the weekday of an invalid date', () => {
    expect(() => isoWeekdayOf('2026-02-30' as never)).toThrow(
      'Invalid date-only value.',
    );
  });

  it('throws when serializing invalid calendar components', () => {
    expect(() =>
      formatDateOnly({ year: 2026, month: 2, day: 30 }),
    ).toThrow('Invalid calendar date.');
  });

  it('calculates month lengths including leap years', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('navigates months across month and year boundaries', () => {
    expect(shiftMonth(2026, 10, 1)).toEqual({ year: 2026, month: 11 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 10, 12)).toEqual({ year: 2027, month: 10 });
    expect(shiftMonth(2026, 10, -12)).toEqual({ year: 2025, month: 10 });
  });

  it('lists every date in a month and resolves its boundaries', () => {
    const february = listMonthDates(2024, 2);

    expect(february).toHaveLength(29);
    expect(february[0]).toBe('2024-02-01');
    expect(february[28]).toBe('2024-02-29');
    expect(startOfMonth('2026-10-19')).toBe('2026-10-01');
    expect(endOfMonth('2026-10-19')).toBe('2026-10-31');
    expect(endOfMonth('2024-02-10')).toBe('2024-02-29');
  });

  it('moves a selected date to another month while clamping the day', () => {
    expect(moveDateToMonth('2026-01-31', 2026, 2)).toBe('2026-02-28');
    expect(moveDateToMonth('2024-01-31', 2024, 2)).toBe('2024-02-29');
    expect(moveDateToMonth('2026-10-19', 2027, 1)).toBe('2027-01-19');
  });

  it('rejects invalid month calculations', () => {
    expect(() => daysInMonth(2026, 13)).toThrow('Invalid calendar month.');
    expect(() => shiftMonth(9999, 12, 1)).toThrow(
      'Resulting year is outside the supported range.',
    );
    expect(() => moveDateToMonth('2026-02-30' as never, 2026, 3)).toThrow(
      'Invalid date-only value.',
    );
  });
});
