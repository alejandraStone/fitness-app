import { describe, expect, it } from '@jest/globals';

import {
  formatRepCount,
  formatSetPerformance,
  formatWorkoutActivityCount,
  formatWorkoutDate,
  formatWorkoutHistorySummary,
} from './format';

describe('workout presentation formatting', () => {
  it('formats a saved workout date in Spanish with its weekday and year', () => {
    expect(formatWorkoutDate('2026-11-02')).toBe(
      'lunes, 2 de noviembre de 2026',
    );
  });

  it('formats the concise history summary with singular and plural labels', () => {
    expect(
      formatWorkoutHistorySummary({ exerciseCount: 1, totalSets: 1 }),
    ).toBe('1 ejercicio · 1 serie');
    expect(
      formatWorkoutHistorySummary({ exerciseCount: 3, totalSets: 12 }),
    ).toBe('3 ejercicios · 12 series');
    expect(
      formatWorkoutHistorySummary({ exerciseCount: 0, totalSets: 0 }),
    ).toBe('0 ejercicios · 0 series');
  });

  it('formats recorded sets with decimals, zero kilograms and singular repetitions', () => {
    expect(formatSetPerformance(72.5, 8)).toBe('72.5 kg · 8 repeticiones');
    expect(formatSetPerformance(0, 1)).toBe('0 kg · 1 repetición');
    expect(formatRepCount(1)).toBe('1 repetición');
    expect(formatRepCount(8)).toBe('8 repeticiones');
  });

  it('formats the monthly activity count with singular and plural labels', () => {
    expect(formatWorkoutActivityCount(1, 'noviembre de 2026')).toBe(
      '1 entrenamiento guardado en noviembre de 2026',
    );
    expect(formatWorkoutActivityCount(4, 'noviembre de 2026')).toBe(
      '4 entrenamientos guardados en noviembre de 2026',
    );
  });
});
