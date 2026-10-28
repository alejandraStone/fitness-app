import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, TouchableRipple } from 'react-native-paper';

import type { Routine } from '../../domain/routines';
import { colors, radii, spacing } from '../../shared/ui/theme';
import { formatWeekdays } from './format';

export interface RoutineSummaryCardProps {
  routine: Routine;
  onPress: () => void;
  onDuplicate: () => void;
  onEditName: () => void;
}

/** Pressable summary of a routine with its routine-level actions. */
export function RoutineSummaryCard({
  routine,
  onPress,
  onDuplicate,
  onEditName,
}: RoutineSummaryCardProps) {
  const exerciseCount = routine.exercises.length;

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <TouchableRipple
          accessibilityLabel={`Abrir rutina ${routine.name}`}
          accessibilityRole="button"
          accessible
          onPress={onPress}
          style={styles.info}
        >
          <View style={styles.infoContent}>
            <Text numberOfLines={2} style={styles.name} variant="titleMedium">
              {routine.name}
            </Text>
            <Text style={styles.meta} variant="bodySmall">
              {formatWeekdays(routine.weekdays)}
            </Text>
            <Text style={styles.meta} variant="bodySmall">
              {exerciseCount}{' '}
              {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
            </Text>
          </View>
        </TouchableRipple>
        <View style={styles.actions}>
          <IconButton
            accessibilityLabel={`Duplicar rutina ${routine.name}`}
            icon="content-copy"
            onPress={onDuplicate}
            size={20}
            style={styles.actionButton}
          />
          <IconButton
            accessibilityLabel={`Editar nombre de ${routine.name}`}
            icon="pencil-outline"
            onPress={onEditName}
            size={20}
            style={styles.actionButton}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: 0,
    paddingRight: spacing.sm,
  },
  info: {
    flex: 1,
    padding: spacing.lg,
    paddingRight: 0,
  },
  infoContent: {
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  actionButton: {
    height: 44,
    margin: 0,
    width: 44,
  },
  meta: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
