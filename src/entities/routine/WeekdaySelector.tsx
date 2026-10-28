import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import type { IsoWeekday } from '../../domain/routines';
import { colors, spacing } from '../../shared/ui/theme';
import { WEEKDAY_OPTIONS } from './format';

export interface WeekdaySelectorProps {
  value: readonly IsoWeekday[];
  onChange: (weekdays: IsoWeekday[]) => void;
  disabled?: boolean;
  /**
   * Weekdays that are already scheduled and must remain selected. The user can
   * add other weekdays without removing these existing assignments.
   */
  disabledWeekdays?: readonly IsoWeekday[];
}

/** Reusable weekday chips for recurring schedules. */
export function WeekdaySelector({
  value,
  onChange,
  disabled = false,
  disabledWeekdays = [],
}: WeekdaySelectorProps) {
  const toggleWeekday = (weekday: IsoWeekday) => {
    if (disabled || disabledWeekdays.includes(weekday)) {
      return;
    }

    const next = value.includes(weekday)
      ? value.filter((item) => item !== weekday)
      : [...value, weekday];
    onChange(next.sort((left, right) => left - right));
  };

  return (
    <View style={styles.row}>
      {WEEKDAY_OPTIONS.map((weekday) => {
        const selected = value.includes(weekday.value);
        const weekdayDisabled =
          disabled || disabledWeekdays.includes(weekday.value);

        return (
          <Chip
            accessibilityLabel={weekday.long}
            accessibilityState={{ disabled: weekdayDisabled, selected }}
            disabled={weekdayDisabled}
            hitSlop={6}
            key={weekday.value}
            mode="outlined"
            onPress={() => toggleWeekday(weekday.value)}
            selected={selected}
            showSelectedCheck={false}
            style={[
              styles.chip,
              selected && { backgroundColor: colors.primary },
            ]}
            textStyle={[
              styles.label,
              selected && { color: colors.onPrimary },
            ]}
          >
            {weekday.short}
          </Chip>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
  },
});
