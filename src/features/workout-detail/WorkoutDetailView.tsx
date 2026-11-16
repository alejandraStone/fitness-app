import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { summarizeWorkout, type Workout } from '../../domain/workouts';
import {
  formatWorkoutDate,
  WorkoutExerciseView,
  WorkoutStatsView,
} from '../../entities/workout';
import { AppButton } from '../../shared/ui/AppButton';
import {
  colors,
  fonts,
  fontSizes,
  radii,
  spacing,
} from '../../shared/ui/theme';
import { CompletedWorkoutIllustration } from './WorkoutSummaryIllustrations';

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
 * The screen follows the approved visual reference: a celebratory hero, one
 * compact stats strip, the progression block and white expandable exercise
 * cards. The final action stays anchored above the bottom safe area.
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

          <Text accessibilityRole="header" style={styles.heroTitle}>
            {'¡Entrenamiento\ncompletado!'}
          </Text>
          <Text style={styles.heroSubtitle}>
            Sigue así, estás logrando grandes avances
          </Text>

          <View style={styles.stats}>
            <WorkoutStatsView stats={summary} />
          </View>

          <View
            accessibilityLabel={`Fecha del entrenamiento: ${date}`}
            accessible
            style={styles.dateRow}
          >
            <Icon
              color={colors.textMuted}
              size={16}
              source="calendar-blank-outline"
            />
            <Text style={styles.date}>{displayDate}</Text>
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
                summary.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'
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
                <WorkoutExerciseView
                  exercise={exercise}
                  key={exercise.id}
                />
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
            <Icon color={colors.positive} size={size} source="check" />
          )}
          label="Finalizar"
          onPress={onFinish}
          style={styles.finishButton}
          variant="dark"
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  illustration: {
    aspectRatio: 280 / 190,
    maxWidth: 280,
    width: '78%',
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    fontWeight: 'normal',
    letterSpacing: -0.8,
    lineHeight: 35,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    maxWidth: 300,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  stats: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 2,
    paddingHorizontal: spacing.sm,
  },
  date: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 18,
    textAlign: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.heading,
    fontWeight: 'normal',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 7,
  },
  countText: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 13,
    fontWeight: 'normal',
  },
  exerciseList: {
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  finishButton: {
    borderRadius: radii.pill,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  finishContent: {
    minHeight: 54,
  },
});
