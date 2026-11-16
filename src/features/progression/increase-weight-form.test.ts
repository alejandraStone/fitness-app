import { describe, expect, it } from '@jest/globals';

import { validateIncreasedWeight } from './increase-weight-form';

describe('validateIncreasedWeight', () => {
  it('accepts a finite weight above the current weight', () => {
    expect(validateIncreasedWeight(' 52.5 ', 50)).toEqual({
      ok: true,
      weightKg: 52.5,
    });
  });

  it('requires an explicit value', () => {
    expect(validateIncreasedWeight('   ', 50)).toEqual({
      ok: false,
      message: 'Introduce el nuevo peso.',
    });
  });

  it('rejects non-numeric and non-positive values', () => {
    expect(validateIncreasedWeight('abc', 50)).toEqual({
      ok: false,
      message: 'Introduce un peso válido.',
    });
    expect(validateIncreasedWeight('0', 50)).toEqual({
      ok: false,
      message: 'Introduce un peso válido.',
    });
    expect(validateIncreasedWeight('-5', 50)).toEqual({
      ok: false,
      message: 'Introduce un peso válido.',
    });
  });

  it('rejects a weight that does not increase the current one', () => {
    expect(validateIncreasedWeight('50', 50)).toEqual({
      ok: false,
      message: 'El nuevo peso debe ser mayor que 50 kg.',
    });
    expect(validateIncreasedWeight('45', 50)).toEqual({
      ok: false,
      message: 'El nuevo peso debe ser mayor que 50 kg.',
    });
  });
});
