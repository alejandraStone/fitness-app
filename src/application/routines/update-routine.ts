import {
  validateIsoWeekdays,
  validateRoutine,
  type IsoWeekday,
  type Routine,
  type RoutineExercise,
  type RoutineExerciseId,
  type RoutineExerciseInput,
  type RoutineId,
  type RoutineRepository,
  type Timestamp,
  type ValidationErrorCode,
} from '../../domain/routines';

/** Exercise entry accepted when editing a routine. */
export interface UpdateRoutineExerciseInput extends RoutineExerciseInput {
  /**
   * Identifier of an existing entry. Omit it when adding a new exercise.
   * Existing identifiers are preserved; omitted entries are removed.
   */
  id?: RoutineExerciseId;
}

/** Input accepted by the routine editing use case. */
export interface UpdateRoutineInput {
  name: string;
  /** Complete exercise configuration in the desired display order. */
  exercises: UpdateRoutineExerciseInput[];
  /**
   * Complete recurring weekday configuration. Omitted preserves the current
   * weekdays; provided values replace them atomically with the routine edit.
   */
  weekdays?: readonly IsoWeekday[];
}

/** External dependencies required to edit a routine. */
export interface UpdateRoutineDependencies {
  routineRepository: RoutineRepository;
  /** Generates identifiers for newly added exercise entries. */
  generateId: () => string;
  /** Returns the current UTC timestamp in ISO 8601 format. */
  now: () => Timestamp;
}

/** Stable identifier of an editing error. */
export type UpdateRoutineErrorCode =
  | ValidationErrorCode
  | 'routine.notFound'
  | 'exercise.unknownId'
  | 'exercise.duplicateId';

/** One editing failure, addressed to a form field. */
export interface UpdateRoutineError {
  field: string;
  code: UpdateRoutineErrorCode;
  message: string;
}

/** Outcome of the routine editing use case. */
export type UpdateRoutineResult =
  | { ok: true; routine: Routine }
  | { ok: false; errors: UpdateRoutineError[] };

/**
 * Replaces the current configuration of an existing routine.
 *
 * The routine name, exercise list and recurring weekdays are validated first.
 * Existing exercise identifiers are preserved, new entries receive generated
 * identifiers, omitted entries are removed and the array position determines
 * the new `order`. When weekdays are omitted they remain unchanged; `createdAt`
 * is always preserved.
 */
export async function updateRoutine(
  routineId: RoutineId,
  input: UpdateRoutineInput,
  dependencies: UpdateRoutineDependencies,
): Promise<UpdateRoutineResult> {
  const validation = validateRoutine({
    name: input.name,
    exercises: input.exercises,
  });
  const weekdaysValidation =
    input.weekdays === undefined
      ? undefined
      : validateIsoWeekdays(input.weekdays);

  if (!validation.ok) {
    return {
      ok: false,
      errors:
        weekdaysValidation !== undefined && !weekdaysValidation.ok
          ? [...validation.errors, ...weekdaysValidation.errors]
          : validation.errors,
    };
  }
  if (weekdaysValidation !== undefined && !weekdaysValidation.ok) {
    return { ok: false, errors: weekdaysValidation.errors };
  }

  const existing = await dependencies.routineRepository.findById(routineId);
  if (existing === null) {
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

  const existingExercisesById = new Map(
    existing.exercises.map((exercise) => [exercise.id, exercise]),
  );
  const usedIds = new Set<RoutineExerciseId>();
  const exerciseIds: (RoutineExerciseId | undefined)[] = [];
  const idErrors: UpdateRoutineError[] = [];

  input.exercises.forEach((exercise, index) => {
    if (exercise.id === undefined) {
      exerciseIds.push(undefined);
      return;
    }

    if (usedIds.has(exercise.id)) {
      idErrors.push({
        field: `exercises[${index}].id`,
        code: 'exercise.duplicateId',
        message: 'El identificador del ejercicio está repetido.',
      });
      exerciseIds.push(undefined);
      return;
    }

    if (!existingExercisesById.has(exercise.id)) {
      idErrors.push({
        field: `exercises[${index}].id`,
        code: 'exercise.unknownId',
        message: 'El ejercicio no pertenece a esta rutina.',
      });
      exerciseIds.push(undefined);
      return;
    }

    usedIds.add(exercise.id);
    exerciseIds.push(exercise.id);
  });

  if (idErrors.length > 0) {
    return { ok: false, errors: idErrors };
  }

  const exercises: RoutineExercise[] = validation.value.exercises.map(
    (exercise, order) => {
      const existingId = exerciseIds[order];
      const entry: RoutineExercise = {
        id: existingId ?? dependencies.generateId(),
        routineId: existing.id,
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
    id: existing.id,
    name: validation.value.name,
    weekdays:
      weekdaysValidation !== undefined
        ? weekdaysValidation.value
        : [...existing.weekdays],
    exercises,
    createdAt: existing.createdAt,
    updatedAt: dependencies.now(),
  };

  await dependencies.routineRepository.update(routine);

  return { ok: true, routine };
}
