import { describe, expect, it } from '@jest/globals';

import { getAssignmentRemovalCopy } from './scheduled-routine-copy';

describe('scheduled routine removal copy', () => {
  it('explains that a recurring routine remains after removing a one-time assignment', () => {
    const copy = getAssignmentRemovalCopy(true);

    expect(copy.label).toBe('Quitar solo esta fecha');
    expect(copy.helper).toContain('seguirá apareciendo');
    expect(copy.helper).toContain('se repite cada semana');
    expect(copy.accessibilityHint).toContain('programación semanal');
  });

  it('explains that a one-time routine stops appearing on the date', () => {
    const copy = getAssignmentRemovalCopy(false);

    expect(copy.label).toBe('Quitar de este día');
    expect(copy.helper).toContain('dejará de aparecer');
    expect(copy.accessibilityHint).toContain('No cambia su programación semanal');
  });
});
