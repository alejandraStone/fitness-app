import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { ScheduledDay } from '../../application/routines/resolve-monthly-schedule';
import type { ScheduledRoutineEntry } from '../../application/routines/schedule-resolution';
import {
  formatDateOnly,
  moveDateToMonth,
  shiftMonth,
  type CalendarMonth,
  type RoutineId,
} from '../../domain/routines';
import { useRoutineServices } from '../../providers/RoutineServicesProvider';
import { Screen } from '../../shared/ui/Screen';
import { colors, radii, spacing } from '../../shared/ui/theme';
import {
  monthOfDateOnly,
  todayDateOnly,
} from '../../features/scheduling/calendar-grid';
import { MonthlyCalendar } from '../../features/scheduling/MonthlyCalendar';
import { ScheduledDayList } from '../../features/scheduling/ScheduledDayList';

type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Home calendar and selected-date schedule.
 *
 * Scheduling is loaded through the application services. A scheduled routine
 * is a plan and is never presented as a completed workout.
 */
export default function HomeScreen() {
  const router = useRouter();
  const services = useRoutineServices();
  const [today, setToday] = useState(() => todayDateOnly());
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() =>
    monthOfDateOnly(today),
  );
  const [days, setDays] = useState<ScheduledDay[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dayActionError, setDayActionError] = useState<string | null>(null);
  const [removingAssignmentId, setRemovingAssignmentId] = useState<
    string | null
  >(null);
  const loadRequest = useRef(0);
  const loadedMonthRef = useRef<string | null>(null);

  const loadMonth = useCallback(
    async (year: number, month: number) => {
      const requestId = loadRequest.current + 1;
      loadRequest.current = requestId;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      // Refreshing after a sheet closes keeps the current plan visible. Only a
      // real month change replaces it with the loading state.
      const preserveData = loadedMonthRef.current === monthKey;

      if (!preserveData) {
        setStatus('loading');
        setDays([]);
      }
      setLoadError(null);
      setDayActionError(null);

      try {
        const result = await services.resolveMonthlySchedule(
          formatDateOnly({ year, month, day: 1 }),
        );
        if (loadRequest.current !== requestId) {
          return;
        }

        if (result.ok) {
          setDays(result.days);
          setStatus('ready');
          loadedMonthRef.current = monthKey;
        } else {
          setLoadError(
            result.errors[0]?.message ?? 'No se pudo cargar tu planificación.',
          );
          setStatus('error');
        }
      } catch {
        if (loadRequest.current === requestId) {
          setLoadError('No se pudo cargar tu planificación.');
          setStatus('error');
        }
      }
    },
    [services],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMonth(visibleMonth.year, visibleMonth.month);
      return () => {
        loadRequest.current += 1;
      };
    }, [loadMonth, visibleMonth.month, visibleMonth.year]),
  );

  const selectedDay = days.find((day) => day.date === selectedDate);
  const entries = useMemo(
    () => selectedDay?.routines ?? [],
    [selectedDay],
  );
  const dayTitle =
    selectedDate === today ? 'Rutinas de hoy' : 'Rutinas del día';
  const scheduledCounts = useMemo(
    () =>
      new Map(
        days.map((day) => [day.date, day.routines.length] as const),
      ),
    [days],
  );

  const openCreateRoutine = () => {
    router.push('/routines/new');
  };

  const openRoutine = (routineId: RoutineId) => {
    router.push({
      pathname: '/routines/[id]',
      params: { id: routineId },
    });
  };

  const openAssignSheet = () => {
    router.push({
      pathname: '/sheets/assign-routine',
      params: { date: selectedDate },
    });
  };

  const selectDate = (date: typeof selectedDate) => {
    setDayActionError(null);
    setSelectedDate(date);
  };

  const shiftVisibleMonth = (offset: number) => {
    const next = shiftMonth(
      visibleMonth.year,
      visibleMonth.month,
      offset,
    );
    setVisibleMonth(next);
    setDayActionError(null);
    setSelectedDate((current) =>
      moveDateToMonth(current, next.year, next.month),
    );
  };

  const goToToday = () => {
    const nextToday = todayDateOnly();
    setToday(nextToday);
    setDayActionError(null);
    setSelectedDate(nextToday);
    setVisibleMonth(monthOfDateOnly(nextToday));
  };

  const removeAssignment = async (entry: ScheduledRoutineEntry) => {
    if (entry.assignment === undefined || removingAssignmentId !== null) {
      return;
    }

    setDayActionError(null);
    setRemovingAssignmentId(entry.assignment.id);
    try {
      const result = await services.removeRoutineAssignment(
        entry.assignment.id,
      );
      if (!result.ok) {
        setDayActionError(
          result.errors[0]?.message ??
            'No se pudo quitar la rutina de este día.',
        );
        return;
      }

      await loadMonth(visibleMonth.year, visibleMonth.month);
    } catch {
      setDayActionError(
        'No se pudo quitar la rutina de este día. Inténtalo de nuevo.',
      );
    } finally {
      setRemovingAssignmentId(null);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.greeting}>
          <Text
            accessibilityRole="header"
            style={styles.greetingText}
            variant="headlineMedium"
          >
            Hola
          </Text>
        </View>

        <MonthlyCalendar
          loading={status === 'loading'}
          month={visibleMonth.month}
          onNextMonth={() => shiftVisibleMonth(1)}
          onPreviousMonth={() => shiftVisibleMonth(-1)}
          onSelectDate={selectDate}
          onToday={goToToday}
          scheduleUnavailable={status === 'error'}
          scheduledCounts={scheduledCounts}
          selectedDate={selectedDate}
          today={today}
          year={visibleMonth.year}
        />

        <ScheduledDayList
          entries={entries}
          errorMessage={status === 'error' ? loadError : dayActionError}
          loading={status === 'loading'}
          onAssignRoutine={openAssignSheet}
          onCreateRoutine={openCreateRoutine}
          onOpenRoutine={openRoutine}
          onRemoveAssignment={(entry) => {
            void removeAssignment(entry);
          }}
          onRetry={() => {
            void loadMonth(visibleMonth.year, visibleMonth.month);
          }}
          removingAssignmentId={removingAssignmentId}
          title={dayTitle}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  greeting: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingText: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
});
