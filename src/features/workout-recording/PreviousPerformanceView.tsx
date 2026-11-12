import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type {
  PreviousExercisePerformance,
  WorkoutSetPerformance,
} from '../../domain/workouts';
import {
  formatSetPerformance,
  formatWorkoutDate,
} from '../../entities/workout/format';
import { colors, radii, spacing } from '../../shared/ui/theme';

export interface PreviousPerformanceViewProps {
  /** Previous result for the exercise; omit or pass null when none exists. */
  performance: PreviousExercisePerformance | null;
}

/**
 * Read-only summary of the most recent saved result for an exercise.
 *
 * Renders nothing when no previous result is available.
 */
export function PreviousPerformanceView({
  performance,
}: PreviousPerformanceViewProps) {
  if (performance === null) {
    return null;
  }

  const date = formatWorkoutDate(performance.date);
  const setsLabel = performance.sets
    .map(
      (set) =>
        `Serie ${set.setNumber}: ${formatSetPerformance(
          set.weightKg,
          set.reps,
        )}`,
    )
    .join('; ');

  return (
    <View
      accessibilityLabel={`Último registro del ${date}. ${setsLabel}`}
      accessible
      style={styles.container}
    >
      <Text style={styles.title} variant="labelLarge">
        Último registro
      </Text>
      <Text style={styles.date} variant="bodySmall">
        {date}
      </Text>
      <View style={styles.sets}>
        {performance.sets.map((set) => (
          <PreviousSetView key={set.setNumber} set={set} />
        ))}
      </View>
    </View>
  );
}

function PreviousSetView({ set }: { set: WorkoutSetPerformance }) {
  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber} variant="bodySmall">
        Serie {set.setNumber}
      </Text>
      <Text style={styles.setPerformance} variant="bodySmall">
        {formatSetPerformance(set.weightKg, set.reps)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  sets: {
    gap: 2,
    marginTop: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  setNumber: {
    color: colors.textMuted,
  },
  setPerformance: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
});
