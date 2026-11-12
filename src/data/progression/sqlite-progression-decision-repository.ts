import type { ProgressionDecisionRepository } from '../../domain/progression';
import type { Timestamp } from '../../domain/routines';
import type {
  WorkoutExerciseId,
  WorkoutId,
} from '../../domain/workouts';
import type { SqliteDatabase } from '../database/sqlite-database';

interface DecisionRow {
  workout_exercise_id: string;
}

/**
 * SQLite implementation of `ProgressionDecisionRepository`.
 *
 * The table stores only explicit keep-weight decisions. Recommendations remain
 * derived from saved workouts and are never persisted here. SQLite stays
 * inside the Data layer.
 */
export class SqliteProgressionDecisionRepository
  implements ProgressionDecisionRepository
{
  constructor(private readonly database: SqliteDatabase) {}

  async findKeepWeightDecisionIds(
    workoutId: WorkoutId,
  ): Promise<WorkoutExerciseId[]> {
    const rows = await this.database.getAllAsync<DecisionRow>(
      `SELECT d.workout_exercise_id
       FROM progression_keep_weight_decisions d
       INNER JOIN workout_exercises e ON e.id = d.workout_exercise_id
       WHERE e.workout_id = ?
       ORDER BY d.workout_exercise_id ASC`,
      [workoutId],
    );

    return rows.map((row) => row.workout_exercise_id);
  }

  async saveKeepWeightDecision(
    workoutExerciseId: WorkoutExerciseId,
    decidedAt: Timestamp,
  ): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO progression_keep_weight_decisions (
         workout_exercise_id, decided_at
       ) VALUES (?, ?)
       ON CONFLICT (workout_exercise_id) DO NOTHING`,
      [workoutExerciseId, decidedAt],
    );
  }
}
