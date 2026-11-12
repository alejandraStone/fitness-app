/**
 * Public interface of the workout presentation entities.
 *
 * Other frontend segments use these exports instead of importing the
 * implementation files directly.
 */
export {
  formatExerciseCount,
  formatRepCount,
  formatSetPerformance,
  formatWorkoutActivityCount,
  formatWorkoutDate,
  formatWorkoutHistorySummary,
} from './format';
export {
  WorkoutExerciseView,
  WorkoutSetView,
} from './WorkoutExerciseView';
export { WorkoutStatsView, type WorkoutStats } from './WorkoutStatsView';
