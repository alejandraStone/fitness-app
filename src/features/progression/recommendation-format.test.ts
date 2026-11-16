import { describe, expect, it } from '@jest/globals';

import type { ProgressionRecommendation } from '../../domain/progression';
import {
  formatDecideLaterAccessibilityLabel,
  formatIncreaseWeightAccessibilityLabel,
  formatKeepWeightAccessibilityLabel,
  formatRecommendationAccessibilityLabel,
  formatRecommendationGoalShort,
  formatRecommendationObjective,
  formatRecommendationRepetitions,
  formatRecommendationRepetitionsShort,
  formatRecommendationToggleAccessibilityLabel,
} from './recommendation-format';

function createRecommendation(
  overrides: Partial<ProgressionRecommendation> = {},
): ProgressionRecommendation {
  return {
    workoutExerciseId: 'workout-exercise-1',
    routineExerciseId: 'routine-exercise-1',
    exerciseName: 'Sentadilla',
    repetitions: [8, 9, 10],
    plannedRepsMax: 8,
    plannedWeightKg: 50,
    ...overrides,
  };
}

describe('progression recommendation formatting', () => {
  it('formats recorded repetitions as a natural-language list', () => {
    expect(formatRecommendationRepetitions(createRecommendation())).toBe(
      '8, 9 y 10 repeticiones',
    );
    expect(
      formatRecommendationRepetitions(
        createRecommendation({ repetitions: [12] }),
      ),
    ).toBe('12 repeticiones');
    expect(
      formatRecommendationRepetitions(
        createRecommendation({ repetitions: [1] }),
      ),
    ).toBe('1 repetición');
  });

  it('formats compact repetitions and goal labels for multiple recommendations', () => {
    expect(
      formatRecommendationRepetitionsShort(createRecommendation()),
    ).toBe('8, 9 y 10 reps');
    expect(
      formatRecommendationRepetitionsShort(
        createRecommendation({ repetitions: [12, 12] }),
      ),
    ).toBe('12 y 12 reps');
    expect(
      formatRecommendationRepetitionsShort(
        createRecommendation({ repetitions: [1] }),
      ),
    ).toBe('1 rep');
    expect(
      formatRecommendationRepetitionsShort(
        createRecommendation({ repetitions: [] }),
      ),
    ).toBe('Sin reps');
    expect(formatRecommendationGoalShort(createRecommendation())).toBe(
      'meta 8',
    );
  });

  it('separates the objective from the recorded repetitions', () => {
    expect(formatRecommendationObjective(createRecommendation())).toBe(
      'Objetivo: 8 repeticiones por serie',
    );
    expect(
      formatRecommendationObjective(
        createRecommendation({ plannedRepsMax: 1 }),
      ),
    ).toBe('Objetivo: 1 repetición por serie');
  });

  it('exposes the exercise, current weight, repetitions and objective', () => {
    expect(
      formatRecommendationAccessibilityLabel(createRecommendation()),
    ).toBe(
      'Sentadilla. Peso actual: 50 kg. 8, 9 y 10 repeticiones. Objetivo: 8 repeticiones por serie. Objetivo cumplido.',
    );
  });

  it('describes the expand and collapse action of one row', () => {
    expect(
      formatRecommendationToggleAccessibilityLabel(
        createRecommendation(),
        false,
      ),
    ).toContain('Mostrar detalles y acciones.');
    expect(
      formatRecommendationToggleAccessibilityLabel(
        createRecommendation(),
        true,
      ),
    ).toContain('Ocultar detalles y acciones.');
  });

  it('provides specific accessibility labels for every action', () => {
    expect(formatIncreaseWeightAccessibilityLabel('Sentadilla')).toBe(
      'Aumentar el peso de Sentadilla',
    );
    expect(formatKeepWeightAccessibilityLabel('Sentadilla')).toBe(
      'Mantener el peso de Sentadilla',
    );
    expect(formatDecideLaterAccessibilityLabel('Sentadilla')).toBe(
      'Decidir más tarde el peso de Sentadilla',
    );
  });
});
