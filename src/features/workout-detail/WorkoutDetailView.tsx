import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { summarizeWorkout, type Workout } from '../../domain/workouts';
import {
  formatWorkoutDate,
  WorkoutExerciseView,
  WorkoutStatsView,
} from '../../entities/workout';
import { AppButton } from '../../shared/ui/AppButton';
import { Card } from '../../shared/ui/Card';
import { colors, spacing } from '../../shared/ui/theme';

export interface WorkoutDetailViewProps {
  workout: Workout;
  onEdit: () => void;
  /**
   * Optional progression card composed by the route. The workout feature does
   * not depend on the progression feature directly.
   */
  progressionCard?: ReactNode;
}

/**
 * Read-only historical record of one saved workout.
 *
 * Everything shown comes from the persisted snapshot and actual sets. No
 * delete or date-editing action is rendered here. The optional progression
 * card is provided by the route and appears between the summary and exercises.
 */
export function WorkoutDetailView({
  workout,
  onEdit,
  progressionCard,
}: WorkoutDetailViewProps) {
  const summary = summarizeWorkout(workout);
  const date = formatWorkoutDate(workout.date);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text accessibilityRole="header" style={styles.name} variant="headlineSmall">
          {workout.routineNameSnapshot}
        </Text>
        <Text
          accessibilityLabel={`Fecha del entrenamiento: ${date}`}
          style={styles.date}
          variant="bodyMedium"
        >
          {date}
        </Text>
        <WorkoutStatsView stats={summary} />
        <AppButton
          accessibilityLabel="Editar entrenamiento"
          icon="pencil-outline"
          label="Editar entrenamiento"
          onPress={onEdit}
          style={styles.editButton}
        />
      </Card>

      {progressionCard}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle} variant="titleLarge">
          Ejercicios
        </Text>

        {workout.exercises.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              Este entrenamiento no tiene ejercicios registrados.
            </Text>
          </Card>
        ) : (
          workout.exercises.map((exercise, index) => (
            <WorkoutExerciseView
              exercise={exercise}
              index={index}
              key={exercise.id}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  name: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  date: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  editButton: {
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
