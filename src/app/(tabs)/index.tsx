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
import type { WorkoutId, WorkoutSummary } from '../../domain/workouts';
import { formatMonthYear } from '../../entities/calendar/format';
import {
  useRoutineServices,
  useWorkoutServices,
} from '../../providers/RoutineServicesProvider';
import { Screen } from '../../shared/ui/Screen';
import { colors, radii, spacing } from '../../shared/ui/theme';
import {
  monthOfDateOnly,
  todayDateOnly,
} from '../../features/scheduling/calendar-grid';
import { MonthlyCalendar } from '../../features/scheduling/MonthlyCalendar';
import { ScheduledDayList } from '../../features/scheduling/ScheduledDayList';
import { WorkoutActivitySummary } from '../../features/workout-history';

type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Home calendar and selected-date schedule.
 *
 * Scheduling is loaded through the application services. A scheduled routine
 * is a plan and is never presented as a completed workout.
 */
export default function HomeScreen() {
  const router = useRouter();
  const routineServices = useRoutineServices();
  const workoutServices = useWorkoutServices();
  const [today, setToday] = useState(() => todayDateOnly());
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() =>
    monthOfDateOnly(today),
  );
  const [days, setDays] = useState<ScheduledDay[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<LoadStatus>('loading');
  const [workoutStatus, setWorkoutStatus] = useState<LoadStatus>('loading');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [workoutsLoadedMonth, setWorkoutsLoadedMonth] = useState<string | null>(
    null,
  );
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
      // Refreshing after a secondary screen closes keeps the current data
      // visible. Only a real month change replaces it with the loading state.
      const preserveData = loadedMonthRef.current === monthKey;
      const monthStart = formatDateOnly({ year, month, day: 1 });

      if (!preserveData) {
        setScheduleStatus('loading');
        setWorkoutStatus('loading');
        setDays([]);
        setWorkouts([]);
        setWorkoutsLoadedMonth(null);
      }
      setScheduleError(null);
      setWorkoutError(null);
      setDayActionError(null);

      const [scheduleResult, workoutResult] = await Promise.allSettled([
        routineServices.resolveMonthlySchedule(monthStart),
        workoutServices.listWorkoutsByMonth(monthStart),
      ]);

      if (loadRequest.current !== requestId) {
        return;
      }

      let successfulSources = 0;

      if (
        scheduleResult.status === 'fulfilled' &&
        scheduleResult.value.ok
      ) {
        setDays(scheduleResult.value.days);
        setScheduleStatus('ready');
        successfulSources += 1;
      } else {
        const message =
          scheduleResult.status === 'fulfilled' && !scheduleResult.value.ok
            ? (scheduleResult.value.errors[0]?.message ??
              'No se pudo cargar tu planificación.')
            : 'No se pudo cargar tu planificación.';
        setScheduleError(message);
        setScheduleStatus('error');
      }

      if (workoutResult.status === 'fulfilled' && workoutResult.value.ok) {
        setWorkouts(workoutResult.value.summaries);
        setWorkoutStatus('ready');
        setWorkoutsLoadedMonth(monthKey);
        successfulSources += 1;
      } else {
        const message =
          workoutResult.status === 'fulfilled' && !workoutResult.value.ok
            ? (workoutResult.value.errors[0]?.message ??
              'No se pudo cargar la actividad del mes.')
            : 'No se pudo cargar la actividad del mes.';
        setWorkoutError(message);
        setWorkoutStatus('error');
      }

      if (successfulSources > 0) {
        loadedMonthRef.current = monthKey;
      }
    },
    [routineServices, workoutServices],
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
  const workoutCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const workout of workouts) {
      counts.set(workout.date, (counts.get(workout.date) ?? 0) + 1);
    }
    return counts;
  }, [workouts]);
  const workoutsBySelectedDate = useMemo(() => {
    const byRoutine = new Map<RoutineId, WorkoutSummary>();
    for (const workout of workouts) {
      if (workout.date === selectedDate) {
        byRoutine.set(workout.routineId, workout);
      }
    }
    return byRoutine;
  }, [selectedDate, workouts]);
  const isFutureDate = selectedDate > today;
  const calendarLoading =
    scheduleStatus === 'loading' || workoutStatus === 'loading';
  const dayListError =
    dayActionError ??
    (scheduleStatus === 'error'
      ? scheduleError
      : workoutStatus === 'error'
        ? workoutError
        : null);
  const showActivity =
    workoutsLoadedMonth ===
    `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, '0')}`;
  const monthLabel = formatMonthYear(visibleMonth.year, visibleMonth.month);

  const openCreateRoutine = () => {
    router.push('/routines/new');
  };

  const openRoutine = (routineId: RoutineId) => {
    router.push({
      pathname: '/routines/[id]',
      params: { id: routineId },
    });
  };

  const openRecordWorkout = (routineId: RoutineId) => {
    router.push({
      pathname: '/workouts/record',
      params: { routineId, date: selectedDate },
    });
  };

  const openWorkout = (workoutId: WorkoutId) => {
    router.push({
      pathname: '/workouts/[id]',
      params: { id: workoutId },
    });
  };

  const openHistory = () => {
    router.push('/workouts/history');
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
      const result = await routineServices.removeRoutineAssignment(
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
          loading={calendarLoading}
          month={visibleMonth.month}
          onNextMonth={() => shiftVisibleMonth(1)}
          onPreviousMonth={() => shiftVisibleMonth(-1)}
          onSelectDate={selectDate}
          onToday={goToToday}
          scheduleUnavailable={scheduleStatus === 'error'}
          scheduledCounts={scheduledCounts}
          selectedDate={selectedDate}
          today={today}
          workoutCounts={workoutCounts}
          year={visibleMonth.year}
        />

        <ScheduledDayList
          entries={entries}
          errorMessage={dayListError}
          isFutureDate={isFutureDate}
          loading={calendarLoading}
          onAssignRoutine={openAssignSheet}
          onCreateRoutine={openCreateRoutine}
          onOpenRoutine={openRoutine}
          onOpenWorkout={openWorkout}
          onRecordWorkout={openRecordWorkout}
          onRemoveAssignment={(entry) => {
            void removeAssignment(entry);
          }}
          onRetry={() => {
            void loadMonth(visibleMonth.year, visibleMonth.month);
          }}
          removingAssignmentId={removingAssignmentId}
          title={dayTitle}
          workoutsAvailable={showActivity}
          workoutsByRoutine={workoutsBySelectedDate}
        />

        {showActivity ? (
          <WorkoutActivitySummary
            count={workouts.length}
            monthLabel={monthLabel}
            onOpenHistory={openHistory}
          />
        ) : null}
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
