/**
 * Public interface of the workout recording feature.
 *
 * Other frontend segments use these exports instead of importing the
 * feature's implementation files directly.
 */
export { ExerciseRecordingCard } from './ExerciseRecordingCard';
export { PreviousPerformanceView } from './PreviousPerformanceView';
export { SetInputRow } from './SetInputRow';
export {
  WorkoutRecordingForm,
  type WorkoutRecordingFormHandle,
  type WorkoutRecordingFormProps,
} from './WorkoutRecordingForm';
export {
  createEditingContext,
  createEditingFormValues,
  createRecordingFormValues,
  validateWorkoutFormValues,
  type WorkoutExerciseFormValues,
  type WorkoutFormValues,
  type WorkoutSetFormValues,
} from './workout-form-values';
