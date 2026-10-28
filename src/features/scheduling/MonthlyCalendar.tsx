import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
} from "react-native-paper";

import type { DateOnly } from "../../domain/routines";
import {
  formatFullDate,
  formatMonthYear,
} from "../../entities/calendar/format";
import { WEEKDAY_OPTIONS } from "../../entities/routine/format";
import { colors, radii, spacing } from "../../shared/ui/theme";
import { buildCalendarGrid } from "./calendar-grid";

export type MonthlyCalendarVariant = "schedule" | "picker";

export interface MonthlyCalendarProps {
  year: number;
  month: number;
  selectedDate: DateOnly;
  today: DateOnly;
  /** Scheduled routine counts by date. Used by the `schedule` variant. */
  scheduledCounts?: ReadonlyMap<DateOnly, number>;
  loading?: boolean;
  /** True when the month request failed and counts are unavailable. */
  scheduleUnavailable?: boolean;
  /**
   * `schedule` shows planning counts and legend; `picker` is a plain date
   * picker used inside dialogs.
   */
  variant?: MonthlyCalendarVariant;
  onSelectDate: (date: DateOnly) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const NO_SCHEDULED_DAYS: ReadonlyMap<DateOnly, number> = new Map();

/**
 * Month view with date selection and scheduled-routine markers.
 *
 * Scheduling state is read from the application layer; the calendar only
 * renders the counts it receives and reports user intent through callbacks.
 */
export function MonthlyCalendar({
  year,
  month,
  selectedDate,
  today,
  scheduledCounts = NO_SCHEDULED_DAYS,
  loading = false,
  scheduleUnavailable = false,
  variant = "schedule",
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: MonthlyCalendarProps) {
  const cells = useMemo(() => buildCalendarGrid(year, month), [month, year]);
  const scheduledDays = scheduledCounts.size;
  const showSchedule = variant === "schedule";

  return (
    <Surface
      elevation={0}
      style={[styles.container, !showSchedule && styles.pickerContainer]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.month} variant="titleLarge">
            {formatMonthYear(year, month)}
          </Text>
          {showSchedule ? (
            <View style={styles.summaryRow}>
              {loading ? (
                <ActivityIndicator color={colors.primary} size={12} />
              ) : null}
              <Text style={styles.summary} variant="bodySmall">
                {loading
                  ? "Actualizando calendario…"
                  : scheduleUnavailable
                    ? "Calendario no disponible"
                    : scheduledDays === 0
                      ? "Sin rutinas este mes"
                      : `${scheduledDays} ${
                          scheduledDays === 1
                            ? "día con rutinas"
                            : "días con rutinas"
                        }`}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.monthActions}>
          <IconButton
            accessibilityLabel="Mes anterior"
            icon="chevron-left"
            iconColor={colors.text}
            onPress={onPreviousMonth}
            size={22}
            style={styles.monthAction}
          />
          <IconButton
            accessibilityLabel="Mes siguiente"
            icon="chevron-right"
            iconColor={colors.text}
            onPress={onNextMonth}
            size={22}
            style={styles.monthAction}
          />
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_OPTIONS.map((weekday) => (
          <Text key={weekday.value} style={styles.weekday} variant="labelSmall">
            {weekday.short}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (date === null) {
            return <View key={`blank-${index}`} style={styles.dayCell} />;
          }

          const selected = date === selectedDate;
          const isToday = date === today;
          const count = showSchedule ? (scheduledCounts.get(date) ?? 0) : 0;
          const accessibilityLabel = showSchedule
            ? `${formatFullDate(date)}${
                count === 0
                  ? ", sin rutinas"
                  : `, ${count} ${count === 1 ? "rutina" : "rutinas"}`
              }`
            : formatFullDate(date);

          return (
            <TouchableRipple
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              borderless
              key={date}
              onPress={() => onSelectDate(date)}
              style={[styles.dayCell, !showSchedule && styles.pickerDayCell]}
            >
              <View
                style={[
                  styles.dayContent,
                  isToday && styles.today,
                  selected && styles.selectedDay,
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isToday && styles.todayLabel,
                    selected && styles.selectedDayLabel,
                  ]}
                  variant="bodyMedium"
                >
                  {Number(date.slice(8, 10))}
                </Text>
                {count > 0 ? (
                  <View style={[styles.dot, selected && styles.selectedDot]} />
                ) : null}
              </View>
            </TouchableRipple>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pickerContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  month: {
    color: colors.text,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  summary: {
    color: colors.textMuted,
  },
  monthActions: {
    flexDirection: "row",
    marginRight: -spacing.sm,
    marginTop: -spacing.xs,
  },
  monthAction: {
    margin: 0,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
  },
  weekday: {
    width: `${100 / 7}%`,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  pickerDayCell: {
    height: 40,
  },
  dayContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radii.md,
  },
  today: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  selectedDay: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayLabel: {
    color: colors.text,
    fontWeight: "600",
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: "800",
  },
  selectedDayLabel: {
    color: colors.onPrimary,
  },
  dot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  selectedDot: {
    backgroundColor: colors.onPrimary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  legendLabel: {
    color: colors.textMuted,
  },
  todayButton: {
    borderRadius: radii.pill,
  },
});
