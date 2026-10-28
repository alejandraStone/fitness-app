import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, Text } from "react-native-paper";

import type { Routine, RoutineAssignment } from "../../../domain/routines";
import { isoWeekdayOf } from "../../../domain/routines";
import { formatLongDate } from "../../../entities/calendar/format";
import { formatRecurringWeekdays } from "../../../entities/routine/format";
import { RoutineExerciseView } from "../../../entities/routine/RoutineExerciseView";
import { summarizeRoutine } from "../../../entities/routine/summary";
import { getAssignmentRemovalCopy } from "../../../features/scheduling";
import { useRoutineServices } from "../../../providers/RoutineServicesProvider";
import { AppButton } from "../../../shared/ui/AppButton";
import { Card } from "../../../shared/ui/Card";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ErrorBanner } from "../../../shared/ui/ErrorBanner";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import { Screen } from "../../../shared/ui/Screen";
import { colors, fontSizes, radii, spacing } from "../../../shared/ui/theme";

type LoadStatus = "loading" | "ready" | "notFound" | "error";

/**
 * Routine detail screen with recurring schedule management, one-time dates
 * and the shared exercise editor.
 */
export default function RoutineDetailScreen() {
  const router = useRouter();
  const services = useRoutineServices();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [assignments, setAssignments] = useState<RoutineAssignment[] | null>(
    null,
  );
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] =
    useState<RoutineAssignment | null>(null);
  const [removingAssignmentId, setRemovingAssignmentId] = useState<
    string | null
  >(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const loadRoutine = useCallback(async () => {
    setStatus((current) => (current === "ready" ? current : "loading"));

    if (id === undefined) {
      setStatus("notFound");
      return;
    }

    try {
      const loaded = await services.getRoutine(id);
      if (loaded === null) {
        setStatus("notFound");
      } else {
        setRoutine(loaded);
        setStatus("ready");
      }
    } catch {
      setStatus("error");
    }
  }, [id, services]);

  const loadAssignments = useCallback(async () => {
    if (id === undefined) {
      return;
    }

    setAssignmentsError(null);
    try {
      const loaded = await services.listRoutineAssignments(id);
      setAssignments(loaded);
    } catch {
      setAssignmentsError("No se pudieron cargar las fechas puntuales.");
    }
  }, [id, services]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutine();
      void loadAssignments();
    }, [loadAssignments, loadRoutine]),
  );

  const confirmRemoval = async () => {
    if (pendingRemoval === null || routine === null) {
      return;
    }

    const assignment = pendingRemoval;
    setRemoveError(null);
    setRemovingAssignmentId(assignment.id);
    try {
      const result = await services.removeRoutineAssignment(assignment.id);
      if (!result.ok) {
        setRemoveError(
          result.errors[0]?.message ??
            "No se pudo quitar la rutina de este día.",
        );
        return;
      }

      setPendingRemoval(null);
      await loadAssignments();
    } catch {
      setRemoveError(
        "No se pudo quitar la rutina de este día. Inténtalo de nuevo.",
      );
    } finally {
      setRemovingAssignmentId(null);
    }
  };

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
            void loadRoutine();
          }}
        />
      </Screen>
    );
  }

  const summary = summarizeRoutine(routine.exercises);
  const removalCopy =
    pendingRemoval === null
      ? null
      : getAssignmentRemovalCopy(
          routine.weekdays.includes(isoWeekdayOf(pendingRemoval.date)),
        );

  return (
    <>
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.name} variant="headlineMedium">
              {routine.name}
            </Text>

            <View style={styles.statsRow}>
              <SummaryStat
                icon="dumbbell"
                label="Ejercicios"
                value={summary.exerciseCount}
              />
              <SummaryStat
                icon="layers-outline"
                label="Series"
                value={summary.totalSets}
              />
              <SummaryStat
                accessibilityLabel={`Reps planificadas: ${summary.totalReps}, calculadas con el mínimo de cada ejercicio`}
                icon="repeat"
                label="Reps"
                value={summary.totalReps}
              />
            </View>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} variant="titleLarge">
              Programación
            </Text>
            <Card>
              <View style={styles.scheduleBlock}>
                <View style={styles.scheduleHeading}>
                  <View style={styles.scheduleLabelRow}>
                    <Icon
                      color={colors.primary}
                      size={18}
                      source="calendar-sync-outline"
                    />
                    <Text style={styles.scheduleLabel} variant="titleSmall">
                      Se repite
                    </Text>
                  </View>
                  <Button
                    accessibilityLabel="Editar días recurrentes"
                    compact
                    contentStyle={styles.compactAction}
                    icon="pencil-outline"
                    mode="text"
                    onPress={() => {
                      router.push({
                        pathname: "/sheets/recurring-days",
                        params: { routineId: routine.id },
                      });
                    }}
                  >
                    Editar
                  </Button>
                </View>
                <Text style={styles.scheduleValue} variant="bodyMedium">
                  {formatRecurringWeekdays(routine.weekdays)}
                </Text>
                {routine.weekdays.length === 0 ? null : null}
              </View>

              <View style={styles.scheduleDivider} />

              <View style={styles.scheduleBlock}>
                <View style={styles.scheduleLabelRow}>
                  <Icon
                    color={colors.primary}
                    size={18}
                    source="calendar-edit"
                  />
                  <Text style={styles.scheduleLabel} variant="titleSmall">
                    Fechas puntuales
                  </Text>
                </View>

                {assignmentsError !== null ? (
                  <>
                    <ErrorBanner message={assignmentsError} />
                    <Button
                      accessibilityLabel="Reintentar carga de fechas puntuales"
                      contentStyle={styles.compactAction}
                      icon="refresh"
                      mode="text"
                      onPress={() => {
                        void loadAssignments();
                      }}
                    >
                      Reintentar
                    </Button>
                  </>
                ) : assignments === null ? (
                  <View style={styles.assignmentsStatus}>
                    <ActivityIndicator color={colors.primary} size={18} />
                    <Text style={styles.helper} variant="bodySmall">
                      Cargando fechas…
                    </Text>
                  </View>
                ) : assignments.length === 0 ? (
                  <Text style={styles.helper} variant="bodySmall">
                    Sin fechas puntuales.
                  </Text>
                ) : (
                  <View style={styles.assignments}>
                    {assignments.map((assignment, index) => {
                      const recurring = routine.weekdays.includes(
                        isoWeekdayOf(assignment.date),
                      );

                      return (
                        <View
                          key={assignment.id}
                          style={[
                            styles.assignmentRow,
                            index > 0 && styles.assignmentRowDivider,
                          ]}
                        >
                          <View style={styles.assignmentText}>
                            <Text
                              style={styles.assignmentDate}
                              variant="bodyMedium"
                            >
                              {formatLongDate(assignment.date)}
                            </Text>
                            {recurring ? (
                              <Text style={styles.helper} variant="bodySmall">
                                También se repite este día.
                              </Text>
                            ) : null}
                          </View>
                          <Button
                            accessibilityLabel={`Quitar la rutina del ${formatLongDate(assignment.date)}`}
                            compact
                            contentStyle={styles.compactAction}
                            disabled={removingAssignmentId !== null}
                            loading={removingAssignmentId === assignment.id}
                            mode="text"
                            onPress={() => {
                              setRemoveError(null);
                              setPendingRemoval(assignment);
                            }}
                            textColor={colors.danger}
                          >
                            Quitar
                          </Button>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} variant="titleLarge">
                Ejercicios
              </Text>
              <Text style={styles.sectionCount} variant="labelLarge">
                {routine.exercises.length}
              </Text>
            </View>

            {routine.exercises.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>
                  Esta rutina no tiene ejercicios configurados.
                </Text>
              </Card>
            ) : (
              routine.exercises.map((exercise, index) => (
                <RoutineExerciseView
                  exercise={exercise}
                  index={index}
                  key={exercise.id}
                  onPress={() => {
                    router.push({
                      pathname: "/sheets/exercise",
                      params: {
                        routineId: routine.id,
                        exerciseId: exercise.id,
                      },
                    });
                  }}
                />
              ))
            )}

            <AppButton
              icon="plus"
              label="Añadir más ejercicios"
              onPress={() => {
                router.push({
                  pathname: "/sheets/exercise",
                  params: { routineId: routine.id },
                });
              }}
            />
          </View>
        </ScrollView>
      </Screen>

      <ConfirmDialog
        confirmAccessibilityHint={removalCopy?.accessibilityHint}
        confirmLabel="Quitar"
        errorMessage={removeError}
        loading={removingAssignmentId !== null}
        message={removalCopy?.helper ?? ""}
        onCancel={() => {
          if (removingAssignmentId === null) {
            setPendingRemoval(null);
            setRemoveError(null);
          }
        }}
        onConfirm={() => {
          void confirmRemoval();
        }}
        title="¿Quitar esta fecha?"
        visible={pendingRemoval !== null}
      />
    </>
  );
}

interface SummaryStatProps {
  icon: string;
  label: string;
  value: number;
  accessibilityLabel?: string;
}

function SummaryStat({
  icon,
  label,
  value,
  accessibilityLabel,
}: SummaryStatProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      accessible
      style={styles.stat}
    >
      <Icon color={colors.primary} size={20} source={icon} />
      <Text style={styles.statValue} variant="titleLarge">
        {value}
      </Text>
      <Text style={styles.statLabel} variant="labelSmall">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  name: {
    color: colors.text,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  statValue: {
    color: colors.text,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    textAlign: "center",
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionCount: {
    color: colors.textMuted,
    fontWeight: "700",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  scheduleBlock: {
    gap: spacing.sm,
  },
  scheduleHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  scheduleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scheduleLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  scheduleValue: {
    color: colors.text,
    fontWeight: "600",
  },
  scheduleDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginVertical: spacing.md,
  },
  helper: {
    color: colors.textMuted,
    fontSize: fontSizes.small,
    lineHeight: 20,
  },
  compactAction: {
    minHeight: 44,
  },
  assignmentsStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  assignments: {
    gap: 0,
  },
  assignmentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  assignmentRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assignmentText: {
    flex: 1,
    gap: 2,
  },
  assignmentDate: {
    color: colors.text,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
