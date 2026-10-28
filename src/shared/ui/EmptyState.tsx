import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from './AppButton';
import { colors, spacing } from './theme';

export interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Shared empty-state presentation with an optional primary action. */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="titleLarge">
        {title}
      </Text>
      <Text style={styles.message} variant="bodyMedium">
        {message}
      </Text>
      {actionLabel !== undefined && onAction !== undefined ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
});
