import type { IsoWeekday } from '../../domain/routines';

export interface WeekdayOption {
  value: IsoWeekday;
  short: string;
  long: string;
}

/** Presentation labels for ISO weekdays, in display order. */
export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = [
  { value: 1, short: 'Lun', long: 'lunes' },
  { value: 2, short: 'Mar', long: 'martes' },
  { value: 3, short: 'Mié', long: 'miércoles' },
  { value: 4, short: 'Jue', long: 'jueves' },
  { value: 5, short: 'Vie', long: 'viernes' },
  { value: 6, short: 'Sáb', long: 'sábado' },
  { value: 7, short: 'Dom', long: 'domingo' },
];

/** Formats recurring weekdays for compact display. */
export function formatWeekdays(weekdays: readonly IsoWeekday[]): string {
  if (weekdays.length === 0) {
    return 'Sin programar';
  }

  return normalizeWeekdays(weekdays)
    .map((weekday) => WEEKDAY_OPTIONS[weekday - 1].short)
    .join(', ');
}

/** Formats recurring weekdays as a natural-language list. */
export function formatWeekdaysLong(weekdays: readonly IsoWeekday[]): string {
  if (weekdays.length === 0) {
    return 'Sin programar';
  }

  const labels = normalizeWeekdays(weekdays).map(
    (weekday) => WEEKDAY_OPTIONS[weekday - 1].long,
  );

  return joinLabels(labels);
}

/** Formats recurring weekdays as a weekly repetition phrase. */
export function formatRecurringWeekdays(
  weekdays: readonly IsoWeekday[],
): string {
  if (weekdays.length === 0) {
    return 'Sin programar';
  }

  const normalized = normalizeWeekdays(weekdays);
  if (normalized.length === WEEKDAY_OPTIONS.length) {
    return 'Todos los días';
  }

  const labels = normalized.map(
    (weekday) => RECURRING_WEEKDAY_LABELS[weekday],
  );

  return `Todos los ${joinLabels(labels)}`;
}

const RECURRING_WEEKDAY_LABELS: Record<IsoWeekday, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábados',
  7: 'domingos',
};

function joinLabels(labels: readonly string[]): string {
  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

function normalizeWeekdays(weekdays: readonly IsoWeekday[]): IsoWeekday[] {
  return [...new Set(weekdays)].sort((left, right) => left - right);
}

/** Formats a planned external weight in kilograms. */
export function formatWeightKg(weightKg: number): string {
  return `${weightKg} kg`;
}

/** Formats a target repetition range. */
export function formatRepRange(min: number, max: number): string {
  const label = max === 1 ? 'repetición' : 'repeticiones';
  return min === max ? `${min} ${label}` : `${min}–${max} ${label}`;
}

/** Formats a planned set count. */
export function formatSetCount(sets: number): string {
  return `${sets} ${sets === 1 ? 'serie' : 'series'}`;
}
