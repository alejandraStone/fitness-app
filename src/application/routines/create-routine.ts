import {
  validateIsoWeekdays,
  validateRoutine,
  type IsoWeekday,
  type Routine,
  type RoutineExercise,
  type RoutineInput,
  type RoutineRepository,
  type Timestamp,
  type ValidationError,
} from '../../domain/routines';

/** Input accepted by the routine creation use case. */
export interface CreateRoutineInput extends RoutineInput {
  /** Recurring weekdays selected during creation; omitted means unscheduled. */
  weekdays?: readonly IsoWeekday[];
}

/** External dependencies required to create a routine. */
export interface CreateRoutineDependencies {
  routineRepository: RoutineRepository;
  /** Generates stable identifiers for the routine and its records. */
  generateId: () => string;
  /** Returns the current UTC timestamp in ISO 8601 format. */
  now: () => Timestamp;
}

/** Outcome of the routine creation use case. */
export type CreateRoutineResult =
  | { ok: true; routine: Routine }
  | { ok: false; errors: ValidationError[] };

/**
 * Creates a routine with its optional recurring weekdays and exercise entries.
 *
 * Input is validated and normalized before identifiers or timestamps are
 * generated. Exercise entries keep the order in which they were provided.
 * Recurring weekdays selected during creation are persisted with the routine;
 * one-time date assignments remain handled by separate use cases.
 */
export async function createRoutine(
  input: CreateRoutineInput,
  dependencies: CreateRoutineDependencies,
): Promise<CreateRoutineResult> {
  const validation = validateRoutine(input);
  const weekdaysValidation = validateIsoWeekdays(input.weekdays ?? []);

  if (!validation.ok || !weekdaysValidation.ok) {
    const errors: ValidationError[] = [];
    if (!validation.ok) {
      errors.push(...validation.errors);
    }
    if (!weekdaysValidation.ok) {
      errors.push(...weekdaysValidation.errors);
    }
    return { ok: false, errors };
  }

  const timestamp = dependencies.now();
  const routineId = dependencies.generateId();

  const exercises: RoutineExercise[] = validation.value.exercises.map(
    (exercise, order) => {
      const entry: RoutineExercise = {
        id: dependencies.generateId(),
        routineId,
        name: exercise.name,
        order,
        targetSets: exercise.targetSets,
        targetRepsMin: exercise.targetRepsMin,
        targetRepsMax: exercise.targetRepsMax,
        targetWeightKg: exercise.targetWeightKg,
      };

      if (exercise.notes !== undefined) {
        entry.notes = exercise.notes;
      }

      return entry;
    },
  );

  const routine: Routine = {
    id: routineId,
    name: validation.value.name,
    weekdays: weekdaysValidation.value,
    exercises,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dependencies.routineRepository.create(routine);

  return { ok: true, routine };
}
