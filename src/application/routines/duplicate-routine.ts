import {
  validateDateOnly,
  type DateOnly,
  type Routine,
  type RoutineAssignment,
  type RoutineExercise,
  type RoutineId,
  type RoutineRepository,
  type Timestamp,
  type ValidationErrorCode,
} from '../../domain/routines';
import { orderRoutineExercises } from './routine-ordering';

/** Input accepted by the routine duplication use case. */
export interface DuplicateRoutineInput {
  /** Date on which the duplicate is scheduled. */
  date: DateOnly;
}

/** External dependencies required to duplicate a routine. */
export interface DuplicateRoutineDependencies {
  routineRepository: RoutineRepository;
  /** Generates stable identifiers for the duplicate and its records. */
  generateId: () => string;
  /** Returns the current UTC timestamp in ISO 8601 format. */
  now: () => Timestamp;
}

/** Failure returned when duplication cannot proceed. */
export interface DuplicateRoutineError {
  field: string;
  code: ValidationErrorCode | 'routine.notFound';
  message: string;
}

/** Outcome of the routine duplication use case. */
export type DuplicateRoutineResult =
  | { ok: true; routine: Routine; assignment: RoutineAssignment }
  | { ok: false; errors: DuplicateRoutineError[] };

/** Suffix appended to the source name to mark the independent copy. */
const COPY_SUFFIX = ' COPIA';

/**
 * Creates an independent copy of a routine and schedules it on a chosen date.
 *
 * The copy keeps the source exercise configuration, receives new identifiers
 * and the current timestamp, and is named `<source name> COPIA`. Recurring
 * weekdays and individual-date assignments are not inherited: the duplicate
 * starts unscheduled and is assigned only to the requested date. The routine
 * and its assignment are persisted in the same repository transaction.
 */
export async function duplicateRoutine(
  routineId: RoutineId,
  input: DuplicateRoutineInput,
  dependencies: DuplicateRoutineDependencies,
): Promise<DuplicateRoutineResult> {
  const dateValidation = validateDateOnly(input.date);
  if (!dateValidation.ok) {
    return { ok: false, errors: dateValidation.errors };
  }

  const source = await dependencies.routineRepository.findById(routineId);
  if (source === null) {
    return {
      ok: false,
      errors: [
        {
          field: 'routineId',
          code: 'routine.notFound',
          message: 'No se encontró la rutina.',
        },
      ],
    };
  }

  const orderedSource = orderRoutineExercises(source);
  const timestamp = dependencies.now();
  const duplicateId = dependencies.generateId();

  const exercises: RoutineExercise[] = orderedSource.exercises.map(
    (exercise, order) => {
      const entry: RoutineExercise = {
        id: dependencies.generateId(),
        routineId: duplicateId,
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

  const duplicate: Routine = {
    id: duplicateId,
    name: `${source.name}${COPY_SUFFIX}`,
    weekdays: [],
    exercises,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const assignment: RoutineAssignment = {
    id: dependencies.generateId(),
    routineId: duplicateId,
    date: dateValidation.value,
  };

  await dependencies.routineRepository.create(duplicate, {
    dateAssignment: assignment,
  });

  return { ok: true, routine: duplicate, assignment };
}
