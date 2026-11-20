import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { summarizeWorkout, type Workout } from "../../domain/workouts";
import {
  formatWorkoutDate,
  WorkoutExerciseView,
  WorkoutStatsView,
} from "../../entities/workout";
import { AppButton } from "../../shared/ui/AppButton";
import {
  fonts,
  fontSizes,
  radii,
  spacing,
  workoutSummaryColors,
} from "../../shared/ui/theme";
import { CompletedWorkoutIllustration } from "./WorkoutSummaryIllustrations";

export interface WorkoutDetailViewProps {
  workout: Workout;
  onFinish: () => void;
  /**
   * Optional progression block composed by the route. The workout feature
   * does not depend on the progression feature directly.
   */
  progressionSection?: ReactNode;
}

/**
 * Saved workout summary.
 *
 * The screen keeps the approved celebratory composition and applies the
 * screen-scoped beige, cream, lime, lavender and sky-blue palette: a cream
 * hero panel, a sky-blue statistics strip, the lavender progression block and
 * cream exercise cards. The final action stays anchored above the bottom safe
 * area.
 */
export function WorkoutDetailView({
  workout,
  onFinish,
  progressionSection,
}: WorkoutDetailViewProps) {
  const summary = summarizeWorkout(workout);
  const date = formatWorkoutDate(workout.date);
  const displayDate = `${date.charAt(0).toUpperCase()}${date.slice(1)}`;

  return (
    <View style={styles.frame}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.illustration}>
            <CompletedWorkoutIllustration />
          </View>

          <View
            accessibilityLabel="¡Entrenamiento completado!"
            accessibilityRole="header"
            accessible
            style={styles.title}
          >
            <Text style={styles.heroTitle}>¡Entrenamiento</Text>
            <View style={styles.highlight}>
              <Text style={styles.highlightText}>completado!</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            ¡Sigue así, estás logrando grandes avances!
          </Text>

          <View
            accessibilityLabel={`Fecha del entrenamiento: ${date}`}
            accessible
            style={styles.dateChip}
          >
            <Icon
              color={workoutSummaryColors.onAccent}
              size={16}
              source="calendar-blank-outline"
            />
            <Text style={styles.date}>{displayDate}</Text>
          </View>

          <View style={styles.stats}>
            <WorkoutStatsView stats={summary} />
          </View>
        </View>

        {progressionSection}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Ejercicios realizados
            </Text>
            <View
              accessibilityLabel={`${summary.exerciseCount} ${
                summary.exerciseCount === 1 ? "ejercicio" : "ejercicios"
              }`}
              accessible
              style={styles.countBadge}
            >
              <Text style={styles.countText}>{summary.exerciseCount}</Text>
            </View>
          </View>

          {workout.exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Este entrenamiento no tiene ejercicios registrados.
              </Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {workout.exercises.map((exercise) => (
                <WorkoutExerciseView exercise={exercise} key={exercise.id} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          accessibilityLabel="Finalizar resumen del entrenamiento"
          contentStyle={styles.finishContent}
          icon={({ size }) => (
            <Icon
              color={workoutSummaryColors.onAction}
              size={size}
              source="check"
            />
          )}
          label="Finalizar"
          onPress={onFinish}
          style={styles.finishButton}
          variant="summaryAction"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  hero: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.surface,
    borderColor: workoutSummaryColors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: workoutSummaryColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  illustration: {
    aspectRatio: 280 / 190,
    maxWidth: 280,
    width: "78%",
  },
  title: {
    alignItems: "center",
    gap: 1,
    marginTop: spacing.xs,
  },
  heroTitle: {
    color: workoutSummaryColors.text,
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    fontWeight: "normal",
    letterSpacing: -0.8,
    lineHeight: 34,
    textAlign: "center",
  },
  highlight: {
    backgroundColor: workoutSummaryColors.action,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 1,
    transform: [{ rotate: "-1.5deg" }],
  },
  highlightText: {
    color: workoutSummaryColors.onAction,
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    fontWeight: "normal",
    letterSpacing: -0.8,
    lineHeight: 34,
    textAlign: "center",
  },
  heroSubtitle: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 14,
    fontWeight: "normal",
    lineHeight: 20,
    maxWidth: 300,
    paddingHorizontal: spacing.sm,
    textAlign: "center",
    marginTop: spacing.md,
  },
  dateChip: {
    alignItems: "center",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 1,
  },
  date: {
    color: workoutSummaryColors.onAccent,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: "normal",
    lineHeight: 18,
    textAlign: "center",
  },
  stats: {
    alignSelf: "stretch",
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: workoutSummaryColors.text,
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.heading,
    fontWeight: "normal",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: workoutSummaryColors.accent,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    minWidth: 28,
    paddingHorizontal: 7,
  },
  countText: {
    color: workoutSummaryColors.onAccent,
    fontFamily: fonts.extraBold,
    fontSize: 13,
    fontWeight: "normal",
  },
  exerciseList: {
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: workoutSummaryColors.surface,
    borderColor: workoutSummaryColors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyText: {
    color: workoutSummaryColors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: workoutSummaryColors.background,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  finishButton: {
    borderRadius: radii.pill,
    elevation: 4,
    shadowColor: workoutSummaryColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  finishContent: {
    minHeight: 54,
  },
});
