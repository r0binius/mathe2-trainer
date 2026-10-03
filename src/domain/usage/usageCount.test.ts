import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { decodeUsageCounts, usageDays, usageSince, withUse } from './usageCount';

const count = { id: 'notes/Meta+n', day: 20_000, byKeys: 2, byMenu: 1 } as const;

describe('decodeUsageCounts', () => {
  it('decodes the counts, as Rust sends them', () => {
    expect(decodeUsageCounts([count])).toStrictEqual(ok([count]));
  });

  it('rejects a count that is not a whole number', () => {
    expect(decodeUsageCounts([{ ...count, byKeys: 1.5 }])).toStrictEqual(
      err({ path: '[0].byKeys', expected: 'an integer' }),
    );
  });
});

describe('usageSince', () => {
  it(`starts ${String(usageDays)} days back, today included`, () => {
    expect(usageSince(20_029)).toBe(20_000);
  });
});

describe('withUse', () => {
  it('adds a use to the count of its shortcut and day', () => {
    expect(withUse([count], { id: 'notes/Meta+n', day: 20_000, by: 'keys' })).toStrictEqual([
      { ...count, byKeys: 3 },
    ]);
  });

  it('starts a count for a shortcut or day without one', () => {
    expect(withUse([count], { id: 'notes/Meta+n', day: 20_001, by: 'menu' })).toStrictEqual([
      count,
      { id: 'notes/Meta+n', day: 20_001, byKeys: 0, byMenu: 1 },
    ]);
  });
});
