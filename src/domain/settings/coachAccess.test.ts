import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { decodeCoachAccess, missingPermissions } from './coachAccess';

describe('decodeCoachAccess', () => {
  it('decodes whether each permission is granted, as Rust sends it', () => {
    const access = { menus: 'granted', input: 'denied' };

    expect(decodeCoachAccess(access)).toStrictEqual(ok(access));
  });

  it('rejects an unknown answer', () => {
    expect(decodeCoachAccess({ menus: 'granted', input: 'maybe' })).toMatchObject(
      err({ path: 'input' }),
    );
  });
});

describe('missingPermissions', () => {
  it('lists what is denied, menus first', () => {
    expect(missingPermissions({ menus: 'denied', input: 'denied' })).toStrictEqual([
      'menus',
      'input',
    ]);
  });

  it('is empty once both are granted', () => {
    expect(missingPermissions({ menus: 'granted', input: 'granted' })).toStrictEqual([]);
  });
});
