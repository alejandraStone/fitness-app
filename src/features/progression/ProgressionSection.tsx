import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TouchableRipple } from 'react-native-paper';

import type { ProgressionRecommendation } from '../../domain/progression';
import type { WorkoutExerciseId } from '../../domain/workouts';
import { formatWeightKg } from '../../entities/routine/format';
import { AppButton } from '../../shared/ui/AppButton';
import {
  ProgressBadge,
  SparkleCluster,
  TrophyIllustration,
} from '../../shared/ui/CelebrationIllustrations';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import {
  colors,
  fonts,
  fontSizes,
  radii,
  spacing,
} from '../../shared/ui/theme';
import {
  formatDecideLaterAccessibilityLabel,
  formatIncreaseWeightAccessibilityLabel,
  formatKeepWeightAccessibilityLabel,
  formatRecommendationGoalShort,
  formatRecommendationRepetitions,
  formatRecommendationRepetitionsShort,
  formatRecommendationToggleAccessibilityLabel,
} from './recommendation-format';
export type ProgressionStatus = 'loading' | 'ready' | 'error';

export interface ProgressionSectionProps {
  status: ProgressionStatus;
  recommendations: ProgressionRecommendation[];
  savingWorkoutExerciseId: WorkoutExerciseId | null;
  errorMessage: string | null;
  onIncreaseWeight: (recommendation: ProgressionRecommendation) => void;
  onKeepWeight: (workoutExerciseId: WorkoutExerciseId) => void;
}

/**
 * Celebratory progression block shown only in Workout Detail.
 *
 * A single recommendation keeps the reference's full trophy card. Multiple
 * recommendations collapse into compact rows so the explanation is not
 * repeated. The application never suggests a specific weight increment.
 */
export function ProgressionSection({
  status,
  recommendations,
  savingWorkoutExerciseId,
  errorMessage,
  onIncreaseWeight,
  onKeepWeight,
}: ProgressionSectionProps) {
  const [expandedIds, setExpandedIds] = useState<
    ReadonlySet<WorkoutExerciseId>
  >(() => new Set());
  const [collapsedIds, setCollapsedIds] = useState<
    ReadonlySet<WorkoutExerciseId>
  >(() => new Set());

  if (status !== 'ready' || recommendations.length === 0) {
    return null;
  }

  const isSaving = savingWorkoutExerciseId !== null;

  if (recommendations.length === 1) {
    const recommendation = recommendations[0];
    const collapsed = collapsedIds.has(recommendation.workoutExerciseId);
    const savingThis =
      savingWorkoutExerciseId === recommendation.workoutExerciseId;

    return (
      <View style={styles.section}>
        <SectionHeader />

        {collapsed ? (
          <CollapsedRecommendation
            onExpand={() => {
              setCollapsedIds((current) => {
                const next = new Set(current);
                next.delete(recommendation.workoutExerciseId);
                return next;
              });
            }}
            recommendation={recommendation}
          />
        ) : (
          <HeroRecommendation
            disabled={isSaving}
            onDecideLater={() => {
              setCollapsedIds((current) => {
                const next = new Set(current);
                next.add(recommendation.workoutExerciseId);
                return next;
              });
            }}
            onIncreaseWeight={() => {
              onIncreaseWeight(recommendation);
            }}
            onKeepWeight={() => {
              onKeepWeight(recommendation.workoutExerciseId);
            }}
            recommendation={recommendation}
            saving={savingThis}
          />
        )}

        {errorMessage === null ? null : <ErrorBanner message={errorMessage} />}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader />

      <View style={styles.multiCard}>
        <View pointerEvents="none" style={styles.sparkles}>
          <SparkleCluster size={48} />
        </View>

        <View style={styles.multiHeader}>
          <View style={styles.multiTrophy}>
            <TrophyIllustration />
          </View>
          <View style={styles.multiHeaderText}>
            <Text style={styles.multiTitle}>¡Superaste tus metas!</Text>
            <Text style={styles.multiSubtitle}>
              {recommendations.length} ejercicios con objetivo cumplido. Elige
              cómo continuar en cada uno.
            </Text>
          </View>
        </View>

        <View style={styles.compactList}>
          {recommendations.map((recommendation) => {
            const expanded = expandedIds.has(recommendation.workoutExerciseId);
            const savingThis =
              savingWorkoutExerciseId === recommendation.workoutExerciseId;

            return (
              <CompactRecommendation
                disabled={isSaving}
                expanded={expanded}
                key={recommendation.workoutExerciseId}
                onDecideLater={() => {
                  setExpandedIds((current) => {
                    const next = new Set(current);
                    next.delete(recommendation.workoutExerciseId);
                    return next;
                  });
                }}
                onIncreaseWeight={() => {
                  onIncreaseWeight(recommendation);
                }}
                onKeepWeight={() => {
                  onKeepWeight(recommendation.workoutExerciseId);
                }}
                onToggle={() => {
                  setExpandedIds((current) => {
                    const next = new Set(current);
                    if (next.has(recommendation.workoutExerciseId)) {
                      next.delete(recommendation.workoutExerciseId);
                    } else {
                      next.add(recommendation.workoutExerciseId);
                    }
                    return next;
                  });
                }}
                recommendation={recommendation}
                saving={savingThis}
              />
            );
          })}
        </View>
      </View>

      {errorMessage === null ? null : <ErrorBanner message={errorMessage} />}
    </View>
  );
}

function SectionHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerBadge}>
        <ProgressBadge />
      </View>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Tu progresión
      </Text>
    </View>
  );
}

interface HeroRecommendationProps {
  recommendation: ProgressionRecommendation;
  disabled: boolean;
  saving: boolean;
  onIncreaseWeight: () => void;
  onKeepWeight: () => void;
  onDecideLater: () => void;
}

function HeroRecommendation({
  recommendation,
  disabled,
  saving,
  onIncreaseWeight,
  onKeepWeight,
  onDecideLater,
}: HeroRecommendationProps) {
  return (
    <View style={styles.heroCard}>
      <View pointerEvents="none" style={styles.sparkles}>
        <SparkleCluster size={52} />
      </View>

      <View style={styles.heroTop}>
        <View style={styles.trophy}>
          <TrophyIllustration />
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.tagRow}>
            <View style={styles.nameTag}>
              <Text style={styles.nameTagText}>
                {recommendation.exerciseName}
              </Text>
            </View>
            <View style={styles.weightTag}>
              <Text style={styles.weightTagText}>
                {formatWeightKg(recommendation.plannedWeightKg)}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>¡Superaste tu meta!</Text>

          <View style={styles.achievementTag}>
            <Icon
              color={colors.onPositive}
              size={13}
              source="check-circle"
            />
            <Text style={styles.achievementText}>Objetivo cumplido</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <Text
        accessibilityLabel={`${recommendation.exerciseName}. ${formatRecommendationRepetitions(
          recommendation,
        )}. Meta de ${recommendation.plannedRepsMax} repeticiones. Objetivo cumplido.`}
        style={styles.explanation}
      >
        Hiciste{' '}
        <Text style={styles.strong}>
          {formatRecommendationRepetitions(recommendation)}
        </Text>{' '}
        y alcanzaste tu meta de{' '}
        <Text style={styles.strong}>{recommendation.plannedRepsMax}</Text>. Te
        recomendamos subir el peso en tu próximo entrenamiento.
      </Text>

      <View style={styles.actions}>
        <AppButton
          accessibilityLabel={formatIncreaseWeightAccessibilityLabel(
            recommendation.exerciseName,
          )}
          contentStyle={styles.primaryActionContent}
          disabled={disabled}
          icon="arrow-up"
          label="Aumentar peso"
          loading={saving}
          onPress={onIncreaseWeight}
          style={styles.action}
        />
        <AppButton
          accessibilityLabel={formatKeepWeightAccessibilityLabel(
            recommendation.exerciseName,
          )}
          contentStyle={styles.secondaryActionContent}
          disabled={disabled}
          label="Mantener peso"
          loading={saving}
          onPress={onKeepWeight}
          style={styles.action}
          variant="outline"
        />
        <Button
          accessibilityLabel={formatDecideLaterAccessibilityLabel(
            recommendation.exerciseName,
          )}
          contentStyle={styles.laterActionContent}
          disabled={disabled}
          icon="clock-outline"
          labelStyle={styles.laterActionLabel}
          mode="text"
          onPress={onDecideLater}
          style={styles.laterAction}
          textColor={colors.textMuted}
        >
          Decidir después
        </Button>
      </View>
    </View>
  );
}

interface CollapsedRecommendationProps {
  recommendation: ProgressionRecommendation;
  onExpand: () => void;
}

function CollapsedRecommendation({
  recommendation,
  onExpand,
}: CollapsedRecommendationProps) {
  return (
    <TouchableRipple
      accessibilityLabel={formatRecommendationToggleAccessibilityLabel(
        recommendation,
        false,
      )}
      accessibilityRole="button"
      accessibilityState={{ expanded: false }}
      accessible
      onPress={onExpand}
      rippleColor={colors.primarySoft}
      style={styles.collapsedCard}
    >
      <View style={styles.collapsedContent}>
        <View style={styles.checkCircle}>
          <Icon color={colors.onPositive} size={17} source="check" />
        </View>

        <View style={styles.collapsedText}>
          <Text style={styles.collapsedName}>
            {recommendation.exerciseName}
          </Text>
          <Text style={styles.collapsedMeta}>
            {formatWeightKg(recommendation.plannedWeightKg)} ·{' '}
            {formatRecommendationRepetitionsShort(recommendation)} ·{' '}
            {formatRecommendationGoalShort(recommendation)}
          </Text>
          <Text style={styles.collapsedStatus}>Objetivo cumplido</Text>
        </View>

        <View style={styles.chevron}>
          <Icon color={colors.primary} size={22} source="chevron-down" />
        </View>
      </View>
    </TouchableRipple>
  );
}

interface CompactRecommendationProps {
  recommendation: ProgressionRecommendation;
  expanded: boolean;
  disabled: boolean;
  saving: boolean;
  onToggle: () => void;
  onIncreaseWeight: () => void;
  onKeepWeight: () => void;
  onDecideLater: () => void;
}

function CompactRecommendation({
  recommendation,
  expanded,
  disabled,
  saving,
  onToggle,
  onIncreaseWeight,
  onKeepWeight,
  onDecideLater,
}: CompactRecommendationProps) {
  return (
    <View style={styles.compactCard}>
      <TouchableRipple
        accessibilityLabel={formatRecommendationToggleAccessibilityLabel(
          recommendation,
          expanded,
        )}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessible
        onPress={onToggle}
        rippleColor={colors.primarySoft}
        style={styles.compactTouch}
      >
        <View style={styles.compactHeader}>
          <View style={styles.checkCircle}>
            <Icon color={colors.onPositive} size={17} source="check" />
          </View>

          <View style={styles.compactText}>
            <Text style={styles.compactName}>
              {recommendation.exerciseName}
            </Text>
            <View style={styles.compactMetaRow}>
              <View style={styles.miniAchievement}>
                <Text style={styles.miniAchievementText}>
                  Objetivo cumplido
                </Text>
              </View>
              <Text style={styles.compactMeta}>
                {formatRecommendationRepetitionsShort(recommendation)} ·{' '}
                {formatRecommendationGoalShort(recommendation)}
              </Text>
            </View>
          </View>

          <View style={styles.compactTrailing}>
            <View style={styles.compactWeightTag}>
              <Text style={styles.compactWeightText}>
                {formatWeightKg(recommendation.plannedWeightKg)}
              </Text>
            </View>
            <Icon
              color={colors.primary}
              size={21}
              source={expanded ? 'chevron-up' : 'chevron-down'}
            />
          </View>
        </View>
      </TouchableRipple>

      {expanded ? (
        <View style={styles.compactActions}>
          <AppButton
            accessibilityLabel={formatIncreaseWeightAccessibilityLabel(
              recommendation.exerciseName,
            )}
            contentStyle={styles.primaryActionContent}
            disabled={disabled}
            icon="arrow-up"
            label="Aumentar peso"
            loading={saving}
            onPress={onIncreaseWeight}
            style={styles.action}
          />
          <AppButton
            accessibilityLabel={formatKeepWeightAccessibilityLabel(
              recommendation.exerciseName,
            )}
            contentStyle={styles.secondaryActionContent}
            disabled={disabled}
            label="Mantener peso"
            loading={saving}
            onPress={onKeepWeight}
            style={styles.action}
            variant="outline"
          />
          <Button
            accessibilityLabel={formatDecideLaterAccessibilityLabel(
              recommendation.exerciseName,
            )}
            contentStyle={styles.laterActionContent}
            disabled={disabled}
            icon="clock-outline"
            labelStyle={styles.laterActionLabel}
            mode="text"
            onPress={onDecideLater}
            textColor={colors.textMuted}
          >
            Decidir después
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBadge: {
    height: 40,
    width: 40,
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
  heroCard: {
    backgroundColor: colors.surfaceLavender,
    borderRadius: radii.xl,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  sparkles: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm,
    zIndex: 1,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  trophy: {
    height: 66,
    width: 66,
  },
  heroInfo: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  tagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nameTag: {
    backgroundColor: colors.lavender,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  nameTagText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: 'normal',
  },
  weightTag: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  weightTagText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: 'normal',
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 23,
    fontWeight: 'normal',
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  achievementTag: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.positive,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  achievementText: {
    color: colors.onPositive,
    fontFamily: fonts.bold,
    fontSize: 11,
    fontWeight: 'normal',
  },
  divider: {
    backgroundColor: 'rgba(108, 43, 217, 0.12)',
    height: 1,
  },
  explanation: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 21,
  },
  strong: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontWeight: 'normal',
  },
  actions: {
    gap: spacing.sm,
  },
  action: {
    alignSelf: 'stretch',
  },
  primaryActionContent: {
    minHeight: 50,
  },
  secondaryActionContent: {
    minHeight: 50,
  },
  laterAction: {
    alignSelf: 'center',
    borderRadius: radii.pill,
  },
  laterActionContent: {
    minHeight: 44,
  },
  laterActionLabel: {
    fontFamily: fonts.bold,
    fontWeight: 'normal',
  },
  multiCard: {
    backgroundColor: colors.surfaceLavender,
    borderRadius: radii.xl,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  multiHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  multiTrophy: {
    height: 54,
    width: 54,
  },
  multiHeaderText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  multiTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    fontWeight: 'normal',
    letterSpacing: -0.4,
    lineHeight: 25,
  },
  multiSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 18,
  },
  compactList: {
    gap: spacing.sm,
  },
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  compactTouch: {
    borderRadius: radii.lg,
  },
  compactHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: colors.positive,
    borderRadius: radii.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  compactText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  compactName: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 20,
  },
  compactMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniAchievement: {
    backgroundColor: colors.positiveSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  miniAchievementText: {
    color: colors.onPositive,
    fontFamily: fonts.bold,
    fontSize: 9.5,
    fontWeight: 'normal',
  },
  compactMeta: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontWeight: 'normal',
  },
  compactTrailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  compactWeightTag: {
    backgroundColor: colors.surfaceSet,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  compactWeightText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 10.5,
    fontWeight: 'normal',
  },
  compactActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  collapsedCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  collapsedContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  collapsedText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  collapsedName: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    fontWeight: 'normal',
  },
  collapsedMeta: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontWeight: 'normal',
  },
  collapsedStatus: {
    color: colors.sage,
    fontFamily: fonts.bold,
    fontSize: 11,
    fontWeight: 'normal',
  },
  chevron: {
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderRadius: radii.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
