import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { ErrorBanner } from './ErrorBanner';
import { colors, radii, spacing } from './theme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  confirmAccessibilityHint?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Shared in-app confirmation for destructive or irreversible actions.
 *
 * A Paper dialog is used on every platform so the same interaction works on
 * native and web. The dialog stays open while the operation is running so a
 * failure can be shown in context.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  destructive = true,
  loading = false,
  errorMessage = null,
  confirmAccessibilityHint,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <Dialog
        dismissable={!loading}
        onDismiss={() => {
          if (!loading) {
            onCancel();
          }
        }}
        style={styles.dialog}
        visible
      >
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text style={styles.message} variant="bodyMedium">
            {message}
          </Text>
          {errorMessage !== null ? (
            <ErrorBanner message={errorMessage} />
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            contentStyle={styles.actionContent}
            disabled={loading}
            icon="close"
            onPress={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            accessibilityHint={confirmAccessibilityHint}
            contentStyle={styles.actionContent}
            disabled={loading}
            icon={destructive ? 'trash-can-outline' : 'check'}
            loading={loading}
            onPress={onConfirm}
            textColor={destructive ? colors.danger : colors.primary}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
  },
  content: {
    gap: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  actionContent: {
    minHeight: 44,
  },
});
