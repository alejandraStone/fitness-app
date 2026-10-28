import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import type { IsoWeekday } from '../../domain/routines';
import { WeekdaySelector } from '../../entities/routine/WeekdaySelector';
import { AppButton } from '../../shared/ui/AppButton';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { SheetFooter, SheetScaffold } from '../../shared/ui/SheetScaffold';
import { colors } from '../../shared/ui/theme';

export interface RecurringDaysSheetProps {
  routineName: string;
  weekdays: readonly IsoWeekday[];
  saving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (weekdays: IsoWeekday[]) => void;
}

/**
 * Edits the recurring weekday schedule independently from one-time dates.
 *
 * The route screen mounts this sheet fresh on each opening, so the draft starts
 * from the routine's saved weekdays without synchronizing state in an effect.
 */
export function RecurringDaysSheet({
  routineName,
  weekdays,
  saving,
  errorMessage,
  onClose,
  onSave,
}: RecurringDaysSheetProps) {
  const [draft, setDraft] = useState<IsoWeekday[]>([...weekdays]);

  return (
    <SheetScaffold
      dismissable={!saving}
      fitToContents
      footer={
        <SheetFooter>
          <AppButton
            disabled={saving}
            label="Cancelar"
            onPress={onClose}
            variant="secondary"
          />
          <AppButton
            label="Guardar días"
            loading={saving}
            onPress={() => onSave([...draft])}
          />
        </SheetFooter>
      }
      onClose={onClose}
      title="Días recurrentes"
    >
      <Text style={styles.hint} variant="bodyMedium">
        Elige los días en los que {routineName} se programa automáticamente.
      </Text>
      <Text style={styles.helper} variant="bodySmall">
        Las fechas puntuales se gestionan desde Inicio. Cambiar estos días no
        modifica esas fechas.
      </Text>
      <WeekdaySelector disabled={saving} onChange={setDraft} value={draft} />
      {errorMessage !== null ? (
        <ErrorBanner message={errorMessage} />
      ) : null}
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.text,
  },
  helper: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
