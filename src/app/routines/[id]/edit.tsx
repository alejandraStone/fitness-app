import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button } from "react-native-paper";

import { validateRoutineName, type Routine } from "../../../domain/routines";
import { routineToFormValues } from "../../../features/routine-management/routine-form-values";
import { useRoutineServices } from "../../../providers/RoutineServicesProvider";
import { AppTextInput } from "../../../shared/ui/AppTextInput";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ErrorBanner } from "../../../shared/ui/ErrorBanner";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import { Screen } from "../../../shared/ui/Screen";
import { SheetHeaderAction } from "../../../shared/ui/SheetHeaderAction";
import { colors, spacing } from "../../../shared/ui/theme";

type LoadStatus = "loading" | "ready" | "notFound" | "error";

/** Edits only the name of an existing routine or deletes it. */
export default function EditRoutineNameScreen() {
  const router = useRouter();
  const services = useRoutineServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [status, setStatus] = useState<LoadStatus>(
    id === undefined ? "notFound" : "loading",
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id === undefined) {
      return;
    }

    let active = true;

    services
      .getRoutine(id)
      .then((loaded) => {
        if (!active) {
          return;
        }

        if (loaded === null) {
          setStatus("notFound");
        } else {
          setRoutine(loaded);
          setName(loaded.name);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, [id, reloadToken, services]);

  const handleSave = useCallback(async () => {
    if (id === undefined || routine === null || saving) {
      return;
    }

    Keyboard.dismiss();
    setFormError(null);
    const nameValidation = validateRoutineName(name);
    if (!nameValidation.ok) {
      setNameError(
        nameValidation.errors[0]?.message ??
          "El nombre de la rutina es obligatorio.",
      );
      return;
    }

    setNameError(null);
    setSaving(true);
    try {
      const result = await services.updateRoutine(id, {
        name: nameValidation.value,
        exercises: routineToFormValues(routine).exercises,
      });

      if (!result.ok) {
        const nameFailure = result.errors.find(
          (error) => error.field === "name",
        );
        if (nameFailure !== undefined) {
          setNameError(nameFailure.message);
        } else {
          setFormError(
            result.errors.map((error) => `• ${error.message}`).join("\n"),
          );
        }
        return;
      }

      router.back();
    } catch {
      setFormError("No se pudo actualizar el nombre. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [id, name, routine, router, saving, services]);

  const handleDelete = useCallback(async () => {
    if (id === undefined || deleting) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);
    try {
      const result = await services.deleteRoutine(id);
      if (result.ok) {
        setDeleteVisible(false);
        router.dismissTo("/routines");
        return;
      }

      setDeleteError(
        result.errors[0]?.message ?? "No se pudo eliminar la rutina.",
      );
    } catch {
      setDeleteError("No se pudo eliminar la rutina. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
    }
  }, [deleting, id, router, services]);

  const canSave = routine !== null && !saving && !deleting;

  if (status === "loading") {
    return (
      <Screen>
        <LoadingState message="Cargando rutina…" />
      </Screen>
    );
  }

  if (status === "notFound") {
    return (
      <Screen>
        <EmptyState
          actionLabel="Volver a rutinas"
          message="Esta rutina ya no existe."
          onAction={() => router.dismissTo("/routines")}
          title="Rutina no encontrada"
        />
      </Screen>
    );
  }

  if (status === "error" || routine === null) {
    return (
      <Screen>
        <ErrorState
          message="No se pudo cargar la rutina."
          onRetry={() => {
            setStatus("loading");
            setReloadToken((current) => current + 1);
          }}
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <SheetHeaderAction
              disabled={!canSave}
              label="Guardar"
              loading={saving}
              onPress={() => {
                void handleSave();
              }}
              primary
            />
          ),
        }}
      />
      <Screen>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {formError !== null ? <ErrorBanner message={formError} /> : null}

            <AppTextInput
              editable={!saving}
              error={nameError ?? undefined}
              label="Nombre de la rutina"
              onChangeText={(value) => {
                setName(value);
                setNameError(null);
                setFormError(null);
              }}
              placeholder="p. ej. Piernas A"
              returnKeyType="done"
              value={name}
            />
            <View style={styles.deleteSection}>
              <Button
                disabled={saving || deleting}
                icon="trash-can-outline"
                loading={deleting}
                mode="text"
                onPress={() => {
                  Keyboard.dismiss();
                  setDeleteError(null);
                  setDeleteVisible(true);
                }}
                textColor={colors.danger}
              >
                Eliminar rutina
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>

      <ConfirmDialog
        confirmLabel="Eliminar"
        errorMessage={deleteError}
        loading={deleting}
        message="Se eliminarán su configuración y sus fechas planificadas. Los entrenamientos guardados no cambian."
        onCancel={() => {
          if (!deleting) {
            setDeleteVisible(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        title="¿Eliminar esta rutina?"
        visible={deleteVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  deleteSection: {
    alignItems: "flex-start",
    marginTop: spacing.xs,
  },
});
