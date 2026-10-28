import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Icon,
  IconButton,
  List,
  Menu,
  Portal,
  Surface,
  Text,
} from 'react-native-paper';

import type { ScheduledRoutineEntry } from '../../application/routines/schedule-resolution';
import type { RoutineId } from '../../domain/routines';
import { Card } from '../../shared/ui/Card';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { colors, radii, spacing } from '../../shared/ui/theme';
import { getAssignmentRemovalCopy } from './scheduled-routine-copy';

export interface ScheduledDayListProps {
  title: string;
  entries: readonly ScheduledRoutineEntry[];
  loading: boolean;
  errorMessage: string | null;
  removingAssignmentId: string | null;
  onRetry: () => void;
  onCreateRoutine: () => void;
  onAssignRoutine: () => void;
  onOpenRoutine: (routineId: RoutineId) => void;
  onRemoveAssignment: (entry: ScheduledRoutineEntry) => void;
}

/**
 * Selected-date schedule section.
 *
 * Routines are presented as plans, never as completed workouts. The card opens
 * the routine summary; the compact overflow menu only manages the one-time
 * assignment to the selected date.
 */
export function ScheduledDayList({
  title,
  entries,
  loading,
  errorMessage,
  removingAssignmentId,
  onRetry,
  onCreateRoutine,
  onAssignRoutine,
  onOpenRoutine,
  onRemoveAssignment,
}: ScheduledDayListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} variant="headlineSmall">
          {title}
        </Text>
        {!loading && errorMessage === null && entries.length > 0 ? (
          <Button
            compact
            contentStyle={styles.sectionAddContent}
            icon="plus"
            mode="text"
            onPress={onAssignRoutine}
          >
            Añadir
          </Button>
        ) : null}
      </View>

      {errorMessage !== null ? (
        <View style={styles.errorGroup}>
          <ErrorBanner message={errorMessage} />
          <Button
            compact
            icon="refresh"
            mode="text"
            onPress={onRetry}
            textColor={colors.primary}
          >
            Reintentar
          </Button>
        </View>
      ) : null}

      {loading ? (
        <Surface elevation={0} style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} size={20} />
          <Text style={styles.mutedText} variant="bodySmall">
            Cargando este día…
          </Text>
        </Surface>
      ) : entries.length === 0 ? (
        errorMessage !== null ? null : (
          <Surface elevation={0} style={styles.emptyCard}>
            <Icon
              color={colors.primary}
              size={32}
              source="calendar-blank-outline"
            />
            <Text style={styles.emptyTitle} variant="titleMedium">
              No hay rutinas para este día
            </Text>
            <View style={styles.emptyActions}>
              <Button
                contentStyle={styles.actionButtonContent}
                icon="calendar-plus"
                mode="contained"
                onPress={onAssignRoutine}
                style={styles.actionButton}
              >
                Usar una rutina
              </Button>
              <Button
                contentStyle={styles.actionButtonContent}
                icon="plus"
                mode="outlined"
                onPress={onCreateRoutine}
                style={styles.actionButton}
              >
                Crear rutina
              </Button>
            </View>
          </Surface>
        )
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <ScheduledRoutineCard
              entry={entry}
              key={entry.routine.id}
              onOpenRoutine={onOpenRoutine}
              onRemoveAssignment={onRemoveAssignment}
              removingAssignmentId={removingAssignmentId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface ScheduledRoutineCardProps {
  entry: ScheduledRoutineEntry;
  removingAssignmentId: string | null;
  onOpenRoutine: (routineId: RoutineId) => void;
  onRemoveAssignment: (entry: ScheduledRoutineEntry) => void;
}

function ScheduledRoutineCard({
  entry,
  removingAssignmentId,
  onOpenRoutine,
  onRemoveAssignment,
}: ScheduledRoutineCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);

  const { routine, assignment, recurring } = entry;
  const exerciseCount = routine.exercises.length;
  const removalCopy =
    assignment === undefined ? null : getAssignmentRemovalCopy(recurring);

  return (
    <Card
      accessibilityLabel={`Abrir rutina ${routine.name}`}
      onPress={() => onOpenRoutine(routine.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text
            numberOfLines={2}
            style={styles.cardTitle}
            variant="titleMedium"
          >
            {routine.name}
          </Text>
          <View style={styles.metaRow}>
            <Icon
              color={colors.textMuted}
              size={16}
              source="dumbbell"
            />
            <Text style={styles.mutedText} variant="bodySmall">
              {exerciseCount}{' '}
              {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
            </Text>
          </View>
        </View>

        {assignment !== undefined ? (
          <Menu
            anchor={
              <IconButton
                accessibilityLabel={`Opciones de ${routine.name}`}
                disabled={removingAssignmentId !== null}
                icon="dots-vertical"
                onPress={(event) => {
                  event.stopPropagation();
                  setMenuVisible(true);
                }}
                style={styles.cardMenu}
              />
            }
            onDismiss={() => setMenuVisible(false)}
            visible={menuVisible}
          >
            <Menu.Item
              leadingIcon="calendar-remove-outline"
              onPress={() => {
                setMenuVisible(false);
                setRemoveVisible(true);
              }}
              title={removalCopy?.label ?? 'Quitar de este día'}
            />
          </Menu>
        ) : null}

        <List.Icon
          color={colors.textMuted}
          icon="chevron-right"
          style={styles.chevron}
        />
      </View>

      <Button
        accessibilityLabel={`Registrar mi entrenamiento: ${routine.name}`}
        contentStyle={styles.registerButtonContent}
        icon="play"
        mode="contained"
        onPress={(event) => {
          event.stopPropagation();
          setRegisterVisible(true);
        }}
        style={styles.registerButton}
      >
        Registrar mi entrenamiento
      </Button>

      {removalCopy !== null ? (
        <ConfirmDialog
          confirmAccessibilityHint={removalCopy.accessibilityHint}
          confirmLabel="Quitar"
          message={removalCopy.helper}
          onCancel={() => setRemoveVisible(false)}
          onConfirm={() => {
            setRemoveVisible(false);
            onRemoveAssignment(entry);
          }}
          title="¿Quitar esta fecha?"
          visible={removeVisible}
        />
      ) : null}

      <Portal>
        <Dialog
          onDismiss={() => setRegisterVisible(false)}
          style={styles.dialog}
          visible={registerVisible}
        >
          <View style={styles.dialogIcon}>
            <Icon color={colors.primary} size={30} source="dumbbell" />
          </View>
          <Dialog.Title style={styles.dialogTitle}>Próximamente</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogMessage} variant="bodyMedium">
              El registro de entrenamientos estará disponible en una próxima
              versión.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button icon="check" onPress={() => setRegisterVisible(false)}>
              Entendido
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionAddContent: {
    minHeight: 44,
  },
  errorGroup: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyActions: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    borderRadius: radii.pill,
    flexGrow: 1,
  },
  actionButtonContent: {
    minHeight: 44,
  },
  list: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitleGroup: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mutedText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  cardMenu: {
    margin: 0,
  },
  chevron: {
    margin: 0,
  },
  registerButton: {
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  registerButtonContent: {
    minHeight: 44,
  },
  dialog: {
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  dialogIcon: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  dialogTitle: {
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  dialogMessage: {
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
