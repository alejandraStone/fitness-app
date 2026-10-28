/**
 * Public interface of the scheduling feature.
 *
 * Other frontend segments use these exports instead of importing the
 * feature's implementation files directly.
 */
export { monthOfDateOnly, todayDateOnly } from './calendar-grid';
export { MonthlyCalendar } from './MonthlyCalendar';
export { getAssignmentRemovalCopy } from './scheduled-routine-copy';
