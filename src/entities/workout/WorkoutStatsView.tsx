import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import type { WorkoutSummary } from '../../domain/workouts';
import { formatSetCount } from '../routine/format';
import { colors, fonts, radii, spacing } from '../../shared/ui/theme';
import { formatExerciseCount, formatRepCount } from './format';

/** Saved-workout totals displayed by Workout Detail and Workout History. */
export type WorkoutStats = Pick<
  WorkoutSummary,
  'exerciseCount' | 'totalSets' | 'totalReps'
>;

export interface WorkoutStatsViewProps {
  stats: WorkoutStats;
}

/**
 * Single compact strip with the exercise, set and repetition totals.
 *
 * The three figures share one soft blush container instead of competing cards.
 */
export function WorkoutStatsView({ stats }: WorkoutStatsViewProps) {
  const values = [
    {
      icon: 'dumbbell',
      label: stats.exerciseCount === 1 ? 'Ejercicio' : 'Ejercicios',
      value: stats.exerciseCount,
    },
    {
      icon: 'layers-outline',
      label: stats.totalSets === 1 ? 'Serie' : 'Series',
      value: stats.totalSets,
    },
    {
      icon: 'repeat',
      label: stats.totalReps === 1 ? 'Repetición' : 'Repeticiones',
      value: stats.totalReps,
    },
  ] as const;

  return (
    <View
      accessibilityLabel={`${formatExerciseCount(
        stats.exerciseCount,
      )}, ${formatSetCount(stats.totalSets)}, ${formatRepCount(
        stats.totalReps,
      )}`}
      accessible
      style={styles.strip}
    >
      {values.map((item, index) => (
        <Fragment key={item.label}>
          {index === 0 ? null : <View style={styles.divider} />}
          <View style={styles.stat}>
            <Icon color={colors.rose} size={20} source={item.icon} />
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    alignItems: 'center',
    backgroundColor: colors.blush,
    borderRadius: radii.xl,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
    justifyContent: 'center',
    minHeight: 72,
  },
  divider: {
    backgroundColor: 'rgba(176, 81, 104, 0.16)',
    height: 50,
    width: 1,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    fontWeight: 'normal',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontWeight: 'normal',
  },
});
