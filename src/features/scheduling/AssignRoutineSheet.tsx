import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Chip,
  Divider,
  Icon,
  List,
  RadioButton,
  Text,
} from 'react-native-paper';

import type {
  DateOnly,
  IsoWeekday,
  Routine,
  RoutineId,
} from '../../domain/routines';
import { isoWeekdayOf } from '../../domain/routines';
import { formatLongDate } from '../../entities/calendar/format';
import { formatWeekdays, WEEKDAY_OPTIONS } from '../../entities/routine/format';
import { WeekdaySelector } from '../../entities/routine/WeekdaySelector';
import { AppButton } from '../../shared/ui/AppButton';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { SheetFooter, SheetScaffold } from '../../shared/ui/SheetScaffold';
import { colors, spacing } from '../../shared/ui/theme';

/** How the user wants to add an existing routine to the selected date. */
export type RoutineScheduleChoice = 'single' | 'recurring';

export interface AssignRoutineSheetProps {
  date: DateOnly;
  routines: readonly Routine[];
  /** Routines already individually assigned to this date. */
  assignedRoutineIds: ReadonlySet<RoutineId>;
  /** Routines that repeat on this date through a recurring weekday. */
  recurringRoutineIds: ReadonlySet<RoutineId>;
  loading: boolean;
  errorMessage: string | null;
  assigningRoutineId: RoutineId | null;
  onClose: () => void;
  onCreateRoutine: () => void;
  /** Clears a previous assignment error when the user changes step. */
  onClearError: () => void;
  onAssign: (
    routineId: RoutineId,
    mode: RoutineScheduleChoice,
    weekdays: readonly IsoWeekday[],
  ) => void;
}

/**
 * Chooses an existing routine and how it should be scheduled on a date.
 *
 * The first step lists routines. The second step offers a one-time assignment
 * or a weekly repetition that always includes the selected weekday. Existing
 * recurring weekdays are shown as locked because this flow adds days; it never
 * silently removes the routine's current schedule.
 */
export function AssignRoutineSheet({
  date,
  routines,
  assignedRoutineIds,
  recurringRoutineIds,
  loading,
  errorMessage,
  assigningRoutineId,
  onClose,
  onCreateRoutine,
  onClearError,
  onAssign,
}: AssignRoutineSheetProps) {
  const [selectedRoutineId, setSelectedRoutineId] = useState<RoutineId | null>(
    null,
  );
  const [mode, setMode] = useState<RoutineScheduleChoice>('single');
  const [additionalWeekdays, setAdditionalWeekdays] = useState<IsoWeekday[]>(
    [],
  );

  const sortedRoutines = [...routines].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const selectedRoutine =
    sortedRoutines.find((routine) => routine.id === selectedRoutineId) ?? null;
  const busy = loading || assigningRoutineId !== null;

  const openScheduleStep = (routine: Routine) => {
    const alreadyOnDate =
      assignedRoutineIds.has(routine.id) ||
      recurringRoutineIds.has(routine.id);

    onClearError();
    setSelectedRoutineId(routine.id);
    setMode(alreadyOnDate ? 'recurring' : 'single');
    setAdditionalWeekdays([]);
  };

  const closeScheduleStep = () => {
    if (busy) {
      return;
    }

    onClearError();
    setSelectedRoutineId(null);
    setAdditionalWeekdays([]);
  };

  if (selectedRoutine !== null) {
    const alreadyAssigned = assignedRoutineIds.has(selectedRoutine.id);
    const alreadyRecurring = recurringRoutineIds.has(selectedRoutine.id);
    const alreadyOnDate = alreadyAssigned || alreadyRecurring;
    const selectedWeekday = isoWeekdayOf(date);
    const selectedWeekdayLabel = WEEKDAY_OPTIONS[selectedWeekday - 1].long;
    const baseWeekdays = uniqueWeekdays([
      ...selectedRoutine.weekdays,
      selectedWeekday,
    ]);
    const weekdaySelection = uniqueWeekdays([
      ...baseWeekdays,
      ...additionalWeekdays,
    ]);
    const allWeekdaysScheduled = baseWeekdays.length === 7;
    const recurrenceHelper = allWeekdaysScheduled
      ? 'Esta rutina ya se repite todos los días.'
      : alreadyRecurring
        ? 'Este día ya se repite. Añade otros días si quieres.'
        : selectedRoutine.weekdays.length > 0
          ? `El ${selectedWeekdayLabel} se añadirá; los días ya programados se mantienen.`
          : `El ${selectedWeekdayLabel} se añadirá. Marca otros días si quieres.`;
    const nothingToAdd =
      mode === 'recurring' &&
      alreadyRecurring &&
      additionalWeekdays.length === 0;
    const saving = assigningRoutineId === selectedRoutine.id;
    const canSubmit =
      !busy &&
      !nothingToAdd &&
      (mode === 'recurring' ? !allWeekdaysScheduled : !alreadyOnDate);

    return (
      <SheetScaffold
        dismissable={!busy}
        footer={
          <SheetFooter>
            <AppButton
              disabled={busy}
              icon="arrow-left"
              label="Volver"
              onPress={closeScheduleStep}
              variant="secondary"
            />
            <AppButton
              disabled={!canSubmit}
              label={mode === 'single' ? 'Añadir a este día' : 'Añadir y repetir'}
              loading={saving}
              onPress={() => {
                if (mode === 'single') {
                  onAssign(selectedRoutine.id, 'single', []);
                  return;
                }

                onAssign(selectedRoutine.id, 'recurring', weekdaySelection);
              }}
            />
          </SheetFooter>
        }
        onClose={onClose}
        title="Planificar rutina"
      >
        <View style={styles.dateRow}>
          <Icon
            color={colors.primary}
            size={20}
            source="calendar-blank-outline"
          />
          <Text style={styles.dateText} variant="bodyMedium">
            {formatLongDate(date)}
          </Text>
        </View>

        <Text style={styles.routineName} variant="titleLarge">
          {selectedRoutine.name}
        </Text>
        <Text style={styles.helper} variant="bodySmall">
          {selectedRoutine.exercises.length}{' '}
          {selectedRoutine.exercises.length === 1
            ? 'ejercicio'
            : 'ejercicios'}
        </Text>

        {errorMessage !== null ? <ErrorBanner message={errorMessage} /> : null}

        <View style={styles.options}>
          <RadioButton.Group
            onValueChange={(value) =>
              setMode(value as RoutineScheduleChoice)
            }
            value={mode}
          >
            <View style={styles.option}>
              <RadioButton.Item
                disabled={busy || alreadyOnDate}
                label="Solo este día"
                labelStyle={styles.optionLabel}
                style={styles.radioItem}
                value="single"
              />
              {alreadyOnDate ? (
                <Text style={styles.optionHelper} variant="bodySmall">
                  Ya está planificada para este día.
                </Text>
              ) : null}
            </View>

            <View style={styles.option}>
              <RadioButton.Item
                disabled={busy}
                label="Repetir cada semana"
                labelStyle={styles.optionLabel}
                style={styles.radioItem}
                value="recurring"
              />
            </View>
          </RadioButton.Group>
        </View>

        {mode === 'recurring' ? (
          <View style={styles.recurrence}>
            <Text style={styles.helper} variant="bodySmall">
              {recurrenceHelper}
            </Text>
            <WeekdaySelector
              disabled={busy}
              disabledWeekdays={baseWeekdays}
              onChange={(next) => {
                setAdditionalWeekdays(
                  next.filter((weekday) => !baseWeekdays.includes(weekday)),
                );
              }}
              value={weekdaySelection}
            />
          </View>
        ) : null}
      </SheetScaffold>
    );
  }

  return (
    <SheetScaffold
      dismissable={!busy}
      footer={
        <SheetFooter>
          <AppButton
            disabled={assigningRoutineId !== null}
            icon="plus"
            label="Crear rutina"
            onPress={onCreateRoutine}
            variant="secondary"
          />
          <AppButton disabled={busy} label="Cerrar" onPress={onClose} />
        </SheetFooter>
      }
      onClose={onClose}
      title="Planificar rutina"
    >
      <Text style={styles.hint} variant="bodyMedium">
        Elige una rutina para el {formatLongDate(date)}.
      </Text>
      <Text style={styles.helper} variant="bodySmall">
        Puedes añadir varias rutinas distintas al mismo día.
      </Text>

      {errorMessage !== null ? <ErrorBanner message={errorMessage} /> : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.helper} variant="bodySmall">
            Cargando rutinas…
          </Text>
        </View>
      ) : sortedRoutines.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon
            color={colors.primary}
            size={32}
            source="clipboard-text-outline"
          />
          <Text style={styles.emptyTitle} variant="titleMedium">
            Aún no tienes rutinas
          </Text>
          <Text style={styles.helper} variant="bodySmall">
            Crea una rutina y luego vuelve aquí para planificarla en tu
            calendario.
          </Text>
        </View>
      ) : (
        <View>
          {sortedRoutines.map((routine, index) => {
            const assigned = assignedRoutineIds.has(routine.id);
            const recurring = recurringRoutineIds.has(routine.id);
            const alreadyOnDate = assigned || recurring;
            const assigning = assigningRoutineId === routine.id;

            return (
              <View key={routine.id}>
                {index > 0 ? <Divider /> : null}
                <List.Item
                  accessibilityLabel={
                    alreadyOnDate
                      ? `${routine.name}, ya planificada. Abrir opciones para añadir otros días`
                      : `Planificar ${routine.name} en esta fecha`
                  }
                  description={`${routine.exercises.length} ${
                    routine.exercises.length === 1
                      ? 'ejercicio'
                      : 'ejercicios'
                  } · ${formatWeekdays(routine.weekdays)}${
                    recurring
                      ? ' · Ya se repite este día'
                      : assigned
                        ? ' · Ya añadida a este día'
                        : ''
                  }`}
                  onPress={() => openScheduleStep(routine)}
                  right={() =>
                    assigning ? (
                      <ActivityIndicator
                        color={colors.primary}
                        size={20}
                        style={styles.trailing}
                      />
                    ) : assigned ? (
                      <Chip
                        compact
                        mode="outlined"
                        style={styles.scheduledChip}
                        textStyle={styles.scheduledChipLabel}
                      >
                        Añadida
                      </Chip>
                    ) : recurring ? (
                      <Chip
                        compact
                        mode="outlined"
                        style={styles.scheduledChip}
                        textStyle={styles.scheduledChipLabel}
                      >
                        Ya se repite
                      </Chip>
                    ) : (
                      <List.Icon
                        color={colors.primary}
                        icon="plus-circle-outline"
                      />
                    )
                  }
                  title={routine.name}
                  titleStyle={styles.routineTitle}
                />
              </View>
            );
          })}
        </View>
      )}
    </SheetScaffold>
  );
}

function uniqueWeekdays(weekdays: readonly IsoWeekday[]): IsoWeekday[] {
  return [...new Set(weekdays)].sort((left, right) => left - right);
}

const styles = StyleSheet.create({
  hint: {
    color: colors.text,
  },
  helper: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  routineTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  trailing: {
    alignSelf: 'center',
    marginRight: spacing.lg,
  },
  scheduledChip: {
    alignSelf: 'center',
    marginRight: spacing.md,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  scheduledChipLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  routineName: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  options: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  option: {
    gap: spacing.xs,
  },
  radioItem: {
    paddingHorizontal: 0,
  },
  optionLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  optionHelper: {
    color: colors.textMuted,
    lineHeight: 18,
    marginLeft: spacing.lg + spacing.sm,
  },
  recurrence: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
