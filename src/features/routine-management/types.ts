import type {
  IsoWeekday,
  RoutineExerciseId,
  ValidatedRoutineExercise,
} from '../../domain/routines';

/** One exercise entry while a routine is being edited in the form. */
export interface RoutineFormExercise extends ValidatedRoutineExercise {
  /** Existing identifier, preserved while editing an entry. */
  id?: RoutineExerciseId;
}

/** Complete values collected by the routine form. */
export interface RoutineFormValues {
  name: string;
  weekdays: IsoWeekday[];
  exercises: RoutineFormExercise[];
}

/** One form failure addressed to an input field. */
export interface RoutineFormError {
  field: string;
  message: string;
}

/** Result returned by the screen after attempting to persist the form. */
export type RoutineFormSubmitResult =
  | { ok: true }
  | { ok: false; errors: RoutineFormError[] };
