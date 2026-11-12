import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { formatWorkoutActivityCount } from '../../entities/workout';
import { Card } from '../../shared/ui/Card';
import { colors, radii, spacing } from '../../shared/ui/theme';

export interface WorkoutActivitySummaryProps {
  /** Number of saved workouts in the visible month. */
  count: number;
  /** Visible month formatted as `noviembre de 2026`. */
  monthLabel: string;
  onOpenHistory: () => void;
}

/**
 * Compact monthly training activity summary with access to Workout History.
 *
 * Only saved workouts contribute to the count; scheduled routines and planned
 * targets are never treated as completed training.
 */
export function WorkoutActivitySummary({
  count,
  monthLabel,
  onOpenHistory,
}: WorkoutActivitySummaryProps) {
  const message =
    count === 0
      ? `Aún no hay entrenamientos guardados en ${monthLabel}.`
      : formatWorkoutActivityCount(count, monthLabel);

  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={styles.sectionTitle}
        variant="headlineSmall"
      >
        Actividad
      </Text>

      <Card>
        <View style={styles.summaryRow}>
          <View style={styles.badge}>
            <Icon color={colors.primary} size={22} source="dumbbell" />
          </View>
          <Text
            accessibilityLabel={`Actividad del mes: ${message}`}
            style={[styles.message, count === 0 && styles.emptyMessage]}
            variant="bodyMedium"
          >
            {message}
          </Text>
        </View>
        <Button
          accessibilityLabel="Ver historial de entrenamientos"
          compact
          contentStyle={styles.actionContent}
          icon="history"
          mode="text"
          onPress={onOpenHistory}
          style={styles.action}
        >
          Ver historial
        </Button>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  message: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  emptyMessage: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  action: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
  },
  actionContent: {
    minHeight: 44,
  },
});
