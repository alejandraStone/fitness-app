import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Text, TouchableRipple } from "react-native-paper";

import type { WorkoutExercise, WorkoutSet } from "../../domain/workouts";
import {
  fonts,
  radii,
  spacing,
  workoutSummaryColors,
} from "../../shared/ui/theme";
import { formatWeightKg } from "../routine/format";
import { ExerciseThumbnailIllustration } from "./ExerciseThumbnailIllustration";
import { formatExerciseUsedWeight } from "./format";

export interface WorkoutExerciseViewProps {
  exercise: WorkoutExercise;
}

/**
 * Cream exercise card used by the workout summary.
 *
 * The collapsed state keeps the exercise identity, target, used weight and set
 * completion visible. Expanding the card reveals the recorded set rows without
 * repeating progression recommendations.
 */
export function WorkoutExerciseView({ exercise }: WorkoutExerciseViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [pressed, setPressed] = useState(false);

  const usedWeight = formatExerciseUsedWeight(exercise.sets);
  const target = `${formatCompactSetCount(
    exercise.plannedSets,
  )} · ${formatCompactRepRange(
    exercise.plannedRepsMin,
    exercise.plannedRepsMax,
  )}`;
  const complete =
    exercise.plannedSets > 0 && exercise.sets.length >= exercise.plannedSets;
  const setCountLabel = `${exercise.sets.length} de ${formatCompactSetCount(
    exercise.plannedSets,
  )}`;
  return (
    <View style={styles.card}>
      <TouchableRipple
        accessibilityLabel={`${exercise.nameSnapshot}. ${target}. Peso utilizado: ${usedWeight}. ${setCountLabel} registradas. ${
          expanded ? "Ocultar resultados." : "Mostrar resultados."
        }`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessible
        onPress={() => {
          setExpanded((current) => !current);
        }}
        onPressIn={() => {
          setPressed(true);
        }}
        onPressOut={() => {
          setPressed(false);
        }}
        rippleColor="transparent"
        underlayColor="transparent"
        style={styles.headerTouch}
      >
        <View style={styles.header}>
          <View style={styles.thumbnail}>
            <ExerciseThumbnailIllustration />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.name}>{exercise.nameSnapshot}</Text>
            <Text style={styles.target}>{target}</Text>
          </View>

          <View style={[styles.chevron, pressed && styles.chevronPressed]}>
            <Icon
              color={workoutSummaryColors.text}
              size={22}
              source={expanded ? "chevron-up" : "chevron-down"}
            />
          </View>
        </View>
      </TouchableRipple>

      <View style={styles.pills}>
        <View style={styles.weightPill}>
          <Text style={styles.weightPillText}>
            Peso usado ·{" "}
            <Text style={styles.weightPillValue}>{usedWeight}</Text>
          </Text>
        </View>

        {exercise.plannedSets > 0 ? (
          <View
            style={[
              styles.completionPill,
              complete ? styles.completionPillDone : styles.completionPillOpen,
            ]}
          >
            <Icon
              color={
                complete
                  ? workoutSummaryColors.onAction
                  : workoutSummaryColors.textMuted
              }
              size={13}
              source={complete ? "check" : "progress-clock"}
            />
            <Text
              style={[
                styles.completionPillText,
                complete
                  ? styles.completionPillTextDone
                  : styles.completionPillTextOpen,
              ]}
            >
              {setCountLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.details}>
          {exercise.notesSnapshot === undefined ? null : (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>Nota</Text>
              <Text style={styles.noteText}>{exercise.notesSnapshot}</Text>
            </View>
          )}

          {exercise.sets.length === 0 ? (
            <Text style={styles.emptySets}>
              No hay series registradas para este ejercicio.
            </Text>
          ) : (
            <View style={styles.sets}>
              {exercise.sets.map((set) => (
                <WorkoutSetView
                  key={set.id}
                  plannedRepsMax={exercise.plannedRepsMax}
                  set={set}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
//esto sirve para mostrar la informacion de cada set de un ejercicio, incluyendo el peso y las repeticiones realizadas, así como si se superó el objetivo de repeticiones planeadas.
export interface WorkoutSetViewProps {
  set: WorkoutSet;
  /** Target repetitions captured in the workout snapshot. */
  plannedRepsMax: number;
}

/** Read-only row with the actual weight and repetitions of one set. */
export function WorkoutSetView({ set, plannedRepsMax }: WorkoutSetViewProps) {
  const extraReps =
    plannedRepsMax > 0 && set.reps > plannedRepsMax
      ? set.reps - plannedRepsMax
      : 0;

  return (
    <View
      accessibilityLabel={`Serie ${set.setNumber}: ${formatWeightKg(
        set.weightKg,
      )}, ${set.reps} ${set.reps === 1 ? "repetición" : "repeticiones"}${
        extraReps > 0 ? `, ${extraReps} por encima del objetivo` : ""
      }`}
      accessible
      style={styles.setRow}
    >
      <View style={styles.setDescription}>
        <Text style={styles.setTitle}>Serie {set.setNumber}</Text>
        <Text style={styles.setWeight}>{formatWeightKg(set.weightKg)}</Text>
      </View>

      <View style={styles.setResult}>
        <Text style={styles.repsValue}>{set.reps}</Text>
        <Text style={styles.repsLabel}>{set.reps === 1 ? "rep" : "reps"}</Text>
      </View>

      {extraReps > 0 ? (
        <View style={styles.extraPill}>
          <Text style={styles.extraPillText}>+{extraReps}</Text>
        </View>
      ) : null}
    </View>
  );
}

function formatCompactSetCount(sets: number): string {
  return `${sets} ${sets === 1 ? "serie" : "series"}`;
}

function formatCompactRepRange(min: number, max: number): string {
  return min === max ? `${min} reps` : `${min}–${max} reps`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: workoutSummaryColors.surface,
    borderColor: workoutSummaryColors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: workoutSummaryColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  headerTouch: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  thumbnail: {
    height: 58,
    width: 58,
  },
  headingText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    fontWeight: "normal",
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  target: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontWeight: "normal",
    lineHeight: 18,
  },
  chevron: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.accentSoft,
    borderRadius: radii.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  chevronPressed: {
    backgroundColor: workoutSummaryColors.accent,
    transform: [{ scale: 0.94 }],
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  weightPill: {
    alignSelf: "flex-start",
    backgroundColor: workoutSummaryColors.infoSoft,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  weightPillText: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontWeight: "normal",
  },
  weightPillValue: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.bold,
  },
  completionPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  completionPillDone: {
    backgroundColor: workoutSummaryColors.action,
  },
  completionPillOpen: {
    backgroundColor: workoutSummaryColors.surfaceMuted,
    borderColor: workoutSummaryColors.border,
    borderWidth: 1,
  },
  completionPillText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: "normal",
  },
  completionPillTextDone: {
    color: workoutSummaryColors.onAction,
  },
  completionPillTextOpen: {
    color: workoutSummaryColors.textMuted,
  },
  details: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  note: {
    backgroundColor: workoutSummaryColors.surfaceMuted,
    borderRadius: radii.md,
    gap: 2,
    padding: spacing.md,
  },
  noteLabel: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 10,
    fontWeight: "normal",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  noteText: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "normal",
    lineHeight: 19,
  },
  emptySets: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  sets: {
    gap: spacing.sm,
  },
  setRow: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.accentSoft,
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  setNumber: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.surface,
    borderColor: workoutSummaryColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  setNumberText: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    fontWeight: "normal",
  },
  setDescription: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  setTitle: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: "normal",
  },
  setWeight: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
    fontWeight: "normal",
  },
  setResult: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 3,
  },
  repsValue: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    fontWeight: "normal",
    letterSpacing: -0.4,
  },
  repsLabel: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontWeight: "normal",
  },
  extraPill: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.action,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 24,
    minWidth: 32,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  extraPillText: {
    color: workoutSummaryColors.onAction,
    fontFamily: fonts.extraBold,
    fontSize: 11,
    fontWeight: "normal",
  },
});
