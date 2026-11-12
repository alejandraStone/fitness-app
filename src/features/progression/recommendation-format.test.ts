import { describe, expect, it } from '@jest/globals';

import type { ProgressionRecommendation } from '../../domain/progression';
import {
  formatKeepWeightAccessibilityLabel,
  formatRecommendationAccessibilityLabel,
  formatRecommendationRow,
  REVIEW_WEIGHT_ACCESSIBILITY_LABEL,
} from './recommendation-format';

function createRecommendation(
  overrides: Partial<ProgressionRecommendation> = {},
): ProgressionRecommendation {
  return {
    workoutExerciseId: 'workout-exercise-1',
    exerciseName: 'Sentadilla',
    repetitions: [8, 9, 10],
    plannedRepsMax: 8,
    ...overrides,
  };
}

describe('progression recommendation formatting', () => {
  it('formats repetitions and the objective with spaces around separators', () => {
    expect(formatRecommendationRow(createRecommendation())).toBe(
      'Sentadilla · 8 / 9 / 10 (objetivo 8)',
    );
  });

  it('keeps a single set readable', () => {
    expect(
      formatRecommendationRow(
        createRecommendation({ repetitions: [12], plannedRepsMax: 12 }),
      ),
    ).toBe('Sentadilla · 12 (objetivo 12)');
  });

  it('includes the name, repetitions and planned maximum in the row label', () => {
    expect(
      formatRecommendationAccessibilityLabel(createRecommendation()),
    ).toBe(
      'Sentadilla: 8, 9, 10 repeticiones. Objetivo 8 repeticiones.',
    );
  });

  it('names the exercise in the keep-weight action label', () => {
    expect(formatKeepWeightAccessibilityLabel('Sentadilla')).toBe(
      'Mantener el peso de Sentadilla',
    );
  });

  it('keeps the review action label focused on the planned weight', () => {
    expect(REVIEW_WEIGHT_ACCESSIBILITY_LABEL).toBe(
      'Revisar el peso planificado en la rutina',
    );
  });
});
