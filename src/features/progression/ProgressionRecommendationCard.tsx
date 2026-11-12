import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import type {
  ProgressionRecommendation,
} from '../../domain/progression';
import type { WorkoutExerciseId } from '../../domain/workouts';
import { AppButton } from '../../shared/ui/AppButton';
import { Card } from '../../shared/ui/Card';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { colors, spacing } from '../../shared/ui/theme';
import {
  formatKeepWeightAccessibilityLabel,
  formatRecommendationAccessibilityLabel,
  formatRecommendationRow,
  REVIEW_WEIGHT_ACCESSIBILITY_LABEL,
} from './recommendation-format';

export interface ProgressionRecommendationCardProps {
  recommendations: ProgressionRecommendation[];
  onReviewWeight: () => void;
  onKeepWeight: (workoutExerciseId: WorkoutExerciseId) => void;
  savingWorkoutExerciseId: WorkoutExerciseId | null;
  errorMessage: string | null;
}

/**
 * Compact advisory card shown only in Workout Detail.
 *
 * The card never changes the planned weight automatically. It offers one
 * review action and one keep-weight decision per recommendation, with a busy
 * state that prevents duplicate submissions.
 */
export function ProgressionRecommendationCard({
  recommendations,
  onReviewWeight,
  onKeepWeight,
  savingWorkoutExerciseId,
  errorMessage,
}: ProgressionRecommendationCardProps) {
  if (recommendations.length === 0) {
    return null;
  }

  const isSaving = savingWorkoutExerciseId !== null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon color={colors.sage} size={24} source="trending-up" />
        <Text
          accessibilityRole="header"
          style={styles.title}
          variant="titleMedium"
        >
          Progresión
        </Text>
      </View>

      <Text style={styles.message} variant="bodyMedium">
        Has alcanzado el máximo en estas series. Puedes considerar subir el
        peso.
      </Text>

      {recommendations.map((recommendation) => (
        <View key={recommendation.workoutExerciseId} style={styles.row}>
          <Text
            accessibilityLabel={formatRecommendationAccessibilityLabel(
              recommendation,
            )}
            style={styles.rowText}
            variant="bodyMedium"
          >
            {formatRecommendationRow(recommendation)}
          </Text>
          <AppButton
            accessibilityLabel={formatKeepWeightAccessibilityLabel(
              recommendation.exerciseName,
            )}
            disabled={isSaving}
            label="Mantener peso"
            loading={
              savingWorkoutExerciseId === recommendation.workoutExerciseId
            }
            onPress={() => {
              onKeepWeight(recommendation.workoutExerciseId);
            }}
            variant="secondary"
          />
        </View>
      ))}

      {errorMessage === null ? null : <ErrorBanner message={errorMessage} />}

      <AppButton
        accessibilityLabel={REVIEW_WEIGHT_ACCESSIBILITY_LABEL}
        disabled={isSaving}
        icon="pencil-outline"
        label="Revisar peso"
        onPress={onReviewWeight}
        style={styles.reviewButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.sageSoft,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  row: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  rowText: {
    color: colors.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  reviewButton: {
    marginTop: spacing.xs,
  },
});
