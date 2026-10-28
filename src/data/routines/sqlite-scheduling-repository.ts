import type {
  DateOnly,
  RoutineAssignment,
  RoutineAssignmentId,
  RoutineId,
  SchedulingRepository,
} from '../../domain/routines';
import type { SqliteDatabase } from '../database/sqlite-database';

interface RoutineAssignmentRow {
  id: string;
  routine_id: string;
  date: string;
}

const ASSIGNMENT_COLUMNS = 'id, routine_id, date';

/** SQLite implementation of `SchedulingRepository`. */
export class SqliteSchedulingRepository implements SchedulingRepository {
  constructor(private readonly database: SqliteDatabase) {}

  async findAssignment(
    routineId: RoutineId,
    date: DateOnly,
  ): Promise<RoutineAssignment | null> {
    const row = await this.database.getFirstAsync<RoutineAssignmentRow>(
      `SELECT ${ASSIGNMENT_COLUMNS} FROM routine_assignments
       WHERE routine_id = ? AND date = ?`,
      [routineId, date],
    );

    return row === null ? null : mapAssignmentRow(row);
  }

  async findAssignmentsByDate(date: DateOnly): Promise<RoutineAssignment[]> {
    const rows = await this.database.getAllAsync<RoutineAssignmentRow>(
      `SELECT ${ASSIGNMENT_COLUMNS} FROM routine_assignments
       WHERE date = ? ORDER BY routine_id ASC, id ASC`,
      [date],
    );

    return rows.map(mapAssignmentRow);
  }

  async findAssignmentsByRoutine(
    routineId: RoutineId,
  ): Promise<RoutineAssignment[]> {
    const rows = await this.database.getAllAsync<RoutineAssignmentRow>(
      `SELECT ${ASSIGNMENT_COLUMNS} FROM routine_assignments
       WHERE routine_id = ? ORDER BY date ASC, id ASC`,
      [routineId],
    );

    return rows.map(mapAssignmentRow);
  }

  async findAssignmentsInRange(
    startDate: DateOnly,
    endDate: DateOnly,
  ): Promise<RoutineAssignment[]> {
    const rows = await this.database.getAllAsync<RoutineAssignmentRow>(
      `SELECT ${ASSIGNMENT_COLUMNS} FROM routine_assignments
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC, routine_id ASC, id ASC`,
      [startDate, endDate],
    );

    return rows.map(mapAssignmentRow);
  }

  async createAssignment(assignment: RoutineAssignment): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO routine_assignments (${ASSIGNMENT_COLUMNS})
       VALUES (?, ?, ?)`,
      [assignment.id, assignment.routineId, assignment.date],
    );
  }

  async deleteAssignment(id: RoutineAssignmentId): Promise<boolean> {
    const result = await this.database.runAsync(
      'DELETE FROM routine_assignments WHERE id = ?',
      [id],
    );

    return result.changes > 0;
  }
}

function mapAssignmentRow(row: RoutineAssignmentRow): RoutineAssignment {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
  };
}
