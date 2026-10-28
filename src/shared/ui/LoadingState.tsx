import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { colors, spacing } from './theme';

export interface LoadingStateProps {
  message?: string;
}

/** Shared centered loading indicator with an optional explanation. */
export function LoadingState({ message = 'Cargando…' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.message} variant="bodyMedium">
        {message}
      </Text>
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
  message: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
