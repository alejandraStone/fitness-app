import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  PaperProvider,
  Portal,
  Text,
} from "react-native-paper";

import type { ProgressionRecommendation } from "../../domain/progression";
import { formatWeightKg } from "../../entities/routine/format";
import { AppTextInput } from "../../shared/ui/AppTextInput";
import { ErrorBanner } from "../../shared/ui/ErrorBanner";
import {
  fonts,
  radii,
  spacing,
  workoutSummaryColors,
  workoutSummaryTheme,
} from "../../shared/ui/theme";
import { validateIncreasedWeight } from "./increase-weight-form";

export interface IncreaseWeightDialogProps {
  recommendation: ProgressionRecommendation;
  loading: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onClearError: () => void;
  onConfirm: (weightKg: number) => void;
}

/**
 * Dialog for entering the next planned weight without any app suggestion.
 *
 * The field always starts empty and the value is validated locally before the
 * route persists it. The dialog stays open while saving so a failure remains
 * visible in context. A scoped Paper theme gives the dialog, its text input
 * and its focus states the same palette as the Workout Detail screen. The
 * provider is mounted in a full-screen absolute host because PaperProvider
 * renders a flex container; without it the provider would consume layout space
 * and shrink the screen behind the dialog. KeyboardAvoidingView shrinks that
 * host above the keyboard on both platforms so the actions stay reachable.
 */
export function IncreaseWeightDialog({
  recommendation,
  loading,
  errorMessage,
  onCancel,
  onClearError,
  onConfirm,
}: IncreaseWeightDialogProps) {
  const [value, setValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const confirm = () => {
    const result = validateIncreasedWeight(
      value,
      recommendation.plannedWeightKg,
    );
    if (!result.ok) {
      setValidationError(result.message);
      return;
    }

    setValidationError(null);
    Keyboard.dismiss();
    onConfirm(result.weightKg);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoiding}>
        <PaperProvider theme={workoutSummaryTheme}>
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
              <Dialog.Title style={styles.title}>Aumentar peso</Dialog.Title>
              <Dialog.Content style={styles.content}>
                <View style={styles.currentWeight}>
                  <Text style={styles.currentLabel}>Peso actual</Text>
                  <Text style={styles.currentValue}>
                    {formatWeightKg(recommendation.plannedWeightKg)}
                  </Text>
                </View>
                <Text style={styles.message}>
                  Escribe el peso que quieres usar en tu próximo entrenamiento.
                </Text>
                <AppTextInput
                  autoFocus
                  contentStyle={styles.inputText}
                  editable={!loading}
                  error={validationError ?? undefined}
                  keyboardType="decimal-pad"
                  label="Nuevo peso (kg)"
                  onChangeText={(nextValue) => {
                    setValue(nextValue);
                    setValidationError(null);
                    onClearError();
                  }}
                  value={value}
                />
                {errorMessage === null ? null : (
                  <ErrorBanner message={errorMessage} />
                )}
              </Dialog.Content>
              <Dialog.Actions style={styles.actions}>
                <Button
                  contentStyle={styles.actionContent}
                  disabled={loading}
                  labelStyle={styles.cancelLabel}
                  onPress={onCancel}
                  textColor={workoutSummaryColors.textMuted}
                >
                  Cancelar
                </Button>
                <Button
                  buttonColor={workoutSummaryColors.action}
                  contentStyle={styles.actionContent}
                  disabled={loading}
                  icon="check"
                  labelStyle={styles.saveLabel}
                  loading={loading}
                  mode="contained"
                  onPress={confirm}
                  style={styles.saveButton}
                  textColor={workoutSummaryColors.onAction}
                >
                  Guardar peso
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </PaperProvider>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  dialog: {
    backgroundColor: workoutSummaryColors.surface,
    borderRadius: radii.xl,
  },
  title: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    fontWeight: "normal",
    letterSpacing: -0.3,
  },
  content: {
    gap: spacing.md,
  },
  currentWeight: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.accentSoft,
    borderRadius: radii.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currentLabel: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontWeight: "normal",
  },
  currentValue: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    fontWeight: "normal",
  },
  message: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  inputText: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionContent: {
    minHeight: 44,
  },
  cancelLabel: {
    fontFamily: fonts.bold,
    fontWeight: "normal",
  },
  saveLabel: {
    fontFamily: fonts.bold,
    fontWeight: "normal",
  },
  saveButton: {
    borderRadius: radii.pill,
  },
});
