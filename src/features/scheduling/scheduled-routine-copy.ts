/**
 * User-facing copy for scheduled routine actions.
 *
 * The Home calendar combines recurring weekdays and one-time date assignments.
 * Removing a one-time assignment never changes recurrence, so the UI must state
 * that consequence before the user acts instead of relying on an icon alone.
 */

/** Visible label, consequence and accessibility hint for removing an assignment. */
export interface AssignmentRemovalCopy {
  /** Label of the action that removes the one-time assignment. */
  label: string;
  /** Explanation displayed next to the action before it is used. */
  helper: string;
  /** Additional context announced by assistive technologies. */
  accessibilityHint: string;
}

/**
 * Returns the copy for removing one individual-date assignment.
 *
 * A routine that also repeats on the selected date remains planned after the
 * one-time assignment is removed. The copy makes that distinction explicit.
 */
export function getAssignmentRemovalCopy(
  recurring: boolean,
): AssignmentRemovalCopy {
  if (recurring) {
    return {
      label: 'Quitar solo esta fecha',
      helper: 'La rutina seguirá apareciendo porque se repite cada semana.',
      accessibilityHint:
        'Quita únicamente la fecha puntual. La rutina seguirá apareciendo por su programación semanal.',
    };
  }

  return {
    label: 'Quitar de este día',
    helper: 'La rutina dejará de aparecer en esta fecha.',
    accessibilityHint:
      'Quita la rutina de esta fecha. No cambia su programación semanal.',
  };
}

