import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Text } from 'react-native-paper';

import { AppButton } from './AppButton';
import { SheetFooter, SheetScaffold } from './SheetScaffold';
import { colors, spacing } from './theme';

export interface SheetStatusProps {
  title: string;
  message: string;
  loading?: boolean;
  fitToContents?: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

/** Loading, empty or error state inside a task sheet. */
export function SheetStatus({
  title,
  message,
  loading = false,
  fitToContents = false,
  onClose,
  onRetry,
}: SheetStatusProps) {
  return (
    <SheetScaffold
      fitToContents={fitToContents}
      footer={
        <SheetFooter>
          {onRetry !== undefined ? (
            <AppButton
              icon="refresh"
              label="Reintentar"
              onPress={onRetry}
              variant="secondary"
            />
          ) : null}
          <AppButton label="Cerrar" onPress={onClose} />
        </SheetFooter>
      }
      onClose={onClose}
      title={title}
    >
      <View style={styles.status}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Icon
            color={colors.primary}
            size={32}
            source="alert-circle-outline"
          />
        )}
        <Text style={styles.message} variant="bodyMedium">
          {message}
        </Text>
      </View>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  message: {
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
