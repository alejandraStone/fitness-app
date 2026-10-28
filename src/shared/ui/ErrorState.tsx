import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from './AppButton';
import { colors, spacing } from './theme';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Shared full-size error presentation for an operation that could not load. */
export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="titleLarge">
        Algo ha ido mal
      </Text>
      <Text style={styles.message} variant="bodyMedium">
        {message}
      </Text>
      {onRetry !== undefined ? (
        <AppButton label={retryLabel} onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
