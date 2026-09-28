import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import germanKeymap from './germanKeymap.fixture.json';
import {
  checkShortcut,
  macosReserved,
  noDuplicateKeys,
  notModifierOnly,
  notReserved,
  practicableKeys,
  practicePolicy,
} from './policy';
import { resolveKeys } from './resolve';

describe('noDuplicateKeys', () => {
  it('passes keys that each appear once', () => {
    expect(noDuplicateKeys(['Shift', 'Meta', 'ß'])).toBeUndefined();
  });

  it('rejects a key that appears twice, naming it', () => {
    expect(noDuplicateKeys(['Shift', 'Shift', 'Meta', 'ß'])).toStrictEqual({
      reason: 'duplicate-key',
      key: 'Shift',
    });
  });
});

describe('notModifierOnly', () => {
  it('passes a combination with a key that is not a modifier', () => {
    expect(notModifierOnly(['Meta', 'k'])).toBeUndefined();
  });

  it('rejects a combination of modifiers only', () => {
    expect(notModifierOnly(['Shift', 'Meta'])).toStrictEqual({ reason: 'modifier-only' });
  });

  it('rejects an empty combination', () => {
    expect(notModifierOnly([])).toStrictEqual({ reason: 'modifier-only' });
  });
});

describe('notReserved', () => {
  const rule = notReserved([['Alt', 'Meta', 'Escape']]);

  it('passes a combination that is not reserved', () => {
    expect(rule(['Meta', 'Escape'])).toBeUndefined();
  });

  it('rejects a reserved combination', () => {
    expect(rule(['Alt', 'Meta', 'Escape'])).toStrictEqual({ reason: 'reserved' });
  });

  it('ignores the order the modifiers are written in', () => {
    expect(rule(['Meta', 'Alt', 'Escape'])).toStrictEqual({ reason: 'reserved' });
  });

  it('passes a combination that only contains a reserved one', () => {
    expect(rule(['Shift', 'Alt', 'Meta', 'Escape'])).toBeUndefined();
  });
});

describe('macosReserved', () => {
  it.each([
    [['Meta', 'Tab']],
    [['Meta', 'Space']],
    [['Shift', 'Meta', '3']],
    [['Control', 'Meta', 'q']],
    [['Control', 'ArrowLeft']],
  ])('contains %j', (keys) => {
    expect(notReserved(macosReserved)(keys)).toStrictEqual({ reason: 'reserved' });
  });

  it('lists every combination in the order the resolver produces', () => {
    expect(macosReserved.map((keys) => resolveKeys(germanKeymap, keys))).toStrictEqual(
      macosReserved,
    );
  });
});

describe('checkShortcut', () => {
  const policy = practicePolicy([['Shift', 'Meta', 'm']]);

  it('returns the keys when every rule passes', () => {
    expect(checkShortcut(policy, ['Meta', 'k'])).toStrictEqual(ok(['Meta', 'k']));
  });

  it('returns the first rejection, in the order of the rules', () => {
    expect(checkShortcut(policy, ['Meta', 'Meta'])).toStrictEqual(
      err({ reason: 'duplicate-key', key: 'Meta' }),
    );
  });

  it('passes an empty policy', () => {
    expect(checkShortcut([], ['Meta'])).toStrictEqual(ok(['Meta']));
  });
});

describe('practicePolicy', () => {
  it('rejects Shift + `?` on a German keymap, where `?` already needs Shift', () => {
    const keys = resolveKeys(germanKeymap, ['Shift', 'Meta', '?']);

    expect(checkShortcut(practicePolicy([]), keys)).toStrictEqual(
      err({ reason: 'duplicate-key', key: 'Shift' }),
    );
  });

  it('rejects the combinations it is given, such as the current trigger', () => {
    expect(
      checkShortcut(practicePolicy([['Shift', 'Meta', 'm']]), ['Shift', 'Meta', 'm']),
    ).toStrictEqual(err({ reason: 'reserved' }));
  });
});

describe('practicableKeys', () => {
  const anything = practicePolicy([]);

  it('picks the alternative with the fewest keys after resolving', () => {
    expect(
      practicableKeys(
        germanKeymap,
        [
          ['Meta', '\\'],
          ['Control', 'Alt', 'k'],
        ],
        anything,
      ),
    ).toStrictEqual(['Control', 'Alt', 'k']);
  });

  it('picks the first alternative when several are equally short', () => {
    expect(
      practicableKeys(
        germanKeymap,
        [
          ['Meta', 'k'],
          ['Meta', 't'],
        ],
        anything,
      ),
    ).toStrictEqual(['Meta', 'k']);
  });

  it('skips alternatives the policy rejects, even shorter ones', () => {
    expect(
      practicableKeys(
        germanKeymap,
        [
          ['Meta', 'Space'],
          ['Control', 'Meta', 'Space'],
        ],
        practicePolicy(macosReserved),
      ),
    ).toStrictEqual(['Control', 'Meta', 'Space']);
  });

  it('finds nothing when the policy rejects every alternative', () => {
    expect(
      practicableKeys(germanKeymap, [['Meta', 'Space']], practicePolicy(macosReserved)),
    ).toBeUndefined();
  });
});
