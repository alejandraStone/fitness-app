import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import {
  moveDateToMonth,
  shiftMonth,
  type DateOnly,
} from '../../domain/routines';
import { formatLongDate } from '../../entities/calendar/format';
import { AppButton } from '../../shared/ui/AppButton';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { SheetFooter, SheetScaffold } from '../../shared/ui/SheetScaffold';
import { colors } from '../../shared/ui/theme';
import {
  monthOfDateOnly,
  MonthlyCalendar,
  todayDateOnly,
} from '../scheduling';

export interface DuplicateRoutineSheetProps {
  routineName: string;
  duplicating: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (date: DateOnly) => void;
}

/**
 * Chooses the date on which an independent copy of a routine is scheduled.
 *
 * The copy is named `<routine name> COPIA` and starts without recurring
 * weekdays or one-time assignments. The route screen mounts this sheet fresh on
 * each opening, so it starts from today without synchronizing state in an
 * effect.
 */
export function DuplicateRoutineSheet({
  routineName,
  duplicating,
  errorMessage,
  onClose,
  onConfirm,
}: DuplicateRoutineSheetProps) {
  const [today] = useState(() => todayDateOnly());
  const [selectedDate, setSelectedDate] = useState<DateOnly>(today);
  // The footer reads the latest choice synchronously; this keeps the selected
  // day available even when a date press and confirmation land in one frame.
  const selectedDateRef = useRef<DateOnly>(today);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthOfDateOnly(today),
  );

  const selectDate = (date: DateOnly) => {
    selectedDateRef.current = date;
    setSelectedDate(date);
  };

  const shiftVisibleMonth = (offset: number) => {
    const next = shiftMonth(
      visibleMonth.year,
      visibleMonth.month,
      offset,
    );
    const nextSelectedDate = moveDateToMonth(
      selectedDateRef.current,
      next.year,
      next.month,
    );
    setVisibleMonth(next);
    selectDate(nextSelectedDate);
  };

  const goToToday = () => {
    const nextToday = todayDateOnly();
    selectDate(nextToday);
    setVisibleMonth(monthOfDateOnly(nextToday));
  };

  return (
    <SheetScaffold
      dismissable={!duplicating}
      fitToContents
      footer={
        <SheetFooter>
          <AppButton
            disabled={duplicating}
            label="Cancelar"
            onPress={onClose}
            variant="secondary"
          />
          <AppButton
            label="Crear copia"
            loading={duplicating}
            onPress={() => onConfirm(selectedDateRef.current)}
          />
        </SheetFooter>
      }
      onClose={onClose}
      title="Duplicar rutina"
    >
      <Text style={styles.hint} variant="bodyMedium">
        Se creará «{routineName} COPIA» como rutina independiente. Elige el día
        al que quieres programarla.
      </Text>
      {errorMessage !== null ? <ErrorBanner message={errorMessage} /> : null}
      <MonthlyCalendar
        month={visibleMonth.month}
        onNextMonth={() => shiftVisibleMonth(1)}
        onPreviousMonth={() => shiftVisibleMonth(-1)}
        onSelectDate={selectDate}
        onToday={goToToday}
        selectedDate={selectedDate}
        today={today}
        variant="picker"
        year={visibleMonth.year}
      />
      <Text style={styles.selection} variant="bodySmall">
        Se programará para el {formatLongDate(selectedDate)}.
      </Text>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  selection: {
    color: colors.text,
    fontWeight: '600',
  },
});
