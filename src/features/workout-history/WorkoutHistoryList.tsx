import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { WorkoutId, WorkoutSummary } from '../../domain/workouts';
import { formatLongDate } from '../../entities/calendar/format';
import { formatWorkoutHistorySummary } from '../../entities/workout';
import { Card } from '../../shared/ui/Card';
import { colors, spacing } from '../../shared/ui/theme';
import { groupWorkoutsByMonth } from './group-workouts-by-month';

export interface WorkoutHistoryListProps {
  summaries: readonly WorkoutSummary[];
  onOpenWorkout: (workoutId: WorkoutId) => void;
}

/**
 * Saved workouts grouped by month, newest first.
 *
 * Only persisted summaries are rendered; scheduled routines never reach this
 * component.
 */
export function WorkoutHistoryList({
  summaries,
  onOpenWorkout,
}: WorkoutHistoryListProps) {
  const groups = useMemo(() => groupWorkoutsByMonth(summaries), [summaries]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text
              accessibilityRole="header"
              style={styles.monthTitle}
              variant="titleMedium"
            >
              {group.title}
            </Text>

            <View style={styles.items}>
              {group.summaries.map((summary) => {
                const date = formatLongDate(summary.date);
                const workoutSummary = formatWorkoutHistorySummary(summary);

                return (
                  <Card
                    accessibilityLabel={`${date}. ${summary.routineNameSnapshot}. ${workoutSummary}`}
                    key={summary.id}
                    onPress={() => onOpenWorkout(summary.id)}
                  >
                    <Text style={styles.name} variant="titleMedium">
                      {summary.routineNameSnapshot}
                    </Text>
                    <Text style={styles.date} variant="bodySmall">
                      {date}
                    </Text>
                    <Text style={styles.summary} variant="bodyMedium">
                      {workoutSummary}
                    </Text>
                  </Card>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  groups: {
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  monthTitle: {
    color: colors.textMuted,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  items: {
    gap: spacing.md,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  summary: {
    color: colors.text,
  },
});
