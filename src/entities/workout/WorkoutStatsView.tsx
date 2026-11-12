import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import type { WorkoutSummary } from '../../domain/workouts';
import { colors, radii, spacing } from '../../shared/ui/theme';

/** Saved-workout totals displayed by Workout Detail and Workout History. */
export type WorkoutStats = Pick<
  WorkoutSummary,
  'exerciseCount' | 'totalSets' | 'totalReps'
>;

export interface WorkoutStatsViewProps {
  stats: WorkoutStats;
}

/**
 * Read-only summary of the exercises, sets and repetitions recorded in a
 * saved workout.
 */
export function WorkoutStatsView({ stats }: WorkoutStatsViewProps) {
  return (
    <View style={styles.row}>
      <SummaryStat
        icon="dumbbell"
        label="Ejercicios"
        value={stats.exerciseCount}
      />
      <SummaryStat icon="layers-outline" label="Series" value={stats.totalSets} />
      <SummaryStat
        accessibilityLabel={`Repeticiones totales: ${stats.totalReps}`}
        icon="repeat"
        label="Reps"
        value={stats.totalReps}
      />
    </View>
  );
}

interface SummaryStatProps {
  icon: string;
  label: string;
  value: number;
  accessibilityLabel?: string;
}

function SummaryStat({
  icon,
  label,
  value,
  accessibilityLabel,
}: SummaryStatProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      accessible
      style={styles.stat}
    >
      <Icon color={colors.primary} size={20} source={icon} />
      <Text style={styles.value} variant="titleLarge">
        {value}
      </Text>
      <Text style={styles.label} variant="labelSmall">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  value: {
    color: colors.text,
    fontWeight: '800',
  },
  label: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
