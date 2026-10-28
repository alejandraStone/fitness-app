import { describe, expect, it } from '@jest/globals';

import {
  formatRecurringWeekdays,
  formatRepRange,
  formatSetCount,
  formatWeekdays,
  formatWeekdaysLong,
  formatWeightKg,
} from './format';

describe('routine presentation formatting', () => {
  it('formats recurring weekdays in ISO order and removes duplicates', () => {
    expect(formatWeekdays([5, 1, 3, 1])).toBe('Lun, Mié, Vie');
    expect(formatWeekdays([])).toBe('Sin programar');
  });

  it('formats recurring weekdays as a natural-language list', () => {
    expect(formatWeekdaysLong([5, 1, 3, 1])).toBe(
      'lunes, miércoles y viernes',
    );
    expect(formatWeekdaysLong([1])).toBe('lunes');
    expect(formatWeekdaysLong([1, 3])).toBe('lunes y miércoles');
    expect(formatWeekdaysLong([])).toBe('Sin programar');
  });

  it('formats recurring weekdays as a weekly repetition phrase', () => {
    expect(formatRecurringWeekdays([1])).toBe('Todos los lunes');
    expect(formatRecurringWeekdays([1, 3])).toBe(
      'Todos los lunes y miércoles',
    );
    expect(formatRecurringWeekdays([7, 6])).toBe(
      'Todos los sábados y domingos',
    );
    expect(formatRecurringWeekdays([1, 2, 3, 4, 5, 6, 7])).toBe(
      'Todos los días',
    );
    expect(formatRecurringWeekdays([])).toBe('Sin programar');
  });

  it('formats planned sets, repetitions and weight', () => {
    expect(formatSetCount(1)).toBe('1 serie');
    expect(formatSetCount(4)).toBe('4 series');
    expect(formatRepRange(8, 8)).toBe('8 repeticiones');
    expect(formatRepRange(8, 12)).toBe('8–12 repeticiones');
    expect(formatRepRange(1, 1)).toBe('1 repetición');
    expect(formatWeightKg(0)).toBe('0 kg');
    expect(formatWeightKg(72.5)).toBe('72.5 kg');
  });
});
