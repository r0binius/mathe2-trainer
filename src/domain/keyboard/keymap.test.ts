import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, ok } from '../shared/result';
import germanKeymap from './germanKeymap.fixture.json';
import type { CurrentLayout, KeyCode, Keymap } from './keymap';
import { afterLayoutChange, decodeCurrentLayout } from './keymap';

describe('Keymap', () => {
  it('describes the German keymap', () => {
    expectTypeOf(germanKeymap).toExtend<Keymap>();
  });

  it('knows exactly the key codes of the German keymap', () => {
    expectTypeOf<keyof typeof germanKeymap>().toEqualTypeOf<KeyCode>();
  });
});

describe('decodeCurrentLayout', () => {
  const id = 'com.apple.keylayout.German';

  it('decodes a layout as the Rust side sends it', () => {
    expect(decodeCurrentLayout({ id, keymap: germanKeymap })).toStrictEqual(
      ok({ id, keymap: germanKeymap }),
    );
  });

  it('leaves out keys it does not know', () => {
    const yen = { value: '¥', withShift: '|', withAlt: '\\', withShiftAlt: '|' };

    expect(decodeCurrentLayout({ id, keymap: { IntlYen: yen } })).toStrictEqual(
      ok({ id, keymap: {} }),
    );
  });

  it('rejects a key without all four characters', () => {
    const keymap = { KeyA: { value: 'a', withShift: 'A', withAlt: 'å' } };

    expect(decodeCurrentLayout({ id, keymap })).toStrictEqual(
      err({ path: 'keymap.KeyA.withShiftAlt', expected: 'a string' }),
    );
  });
});

describe('afterLayoutChange', () => {
  const german: CurrentLayout = { id: 'com.apple.keylayout.German', keymap: germanKeymap };
  const us: CurrentLayout = { id: 'com.apple.keylayout.US', keymap: {} };
  const failed = { kind: 'keymap', message: 'no keyboard layout is selected' } as const;

  it('switches to a layout with another ID', () => {
    expect(afterLayoutChange({ status: 'loaded', value: german }, ok(us))).toStrictEqual({
      status: 'loaded',
      value: us,
    });
  });

  it('keeps the very same state when the ID is the same, so nothing re-resolves', () => {
    const current = { status: 'loaded', value: german } as const;

    expect(afterLayoutChange(current, ok({ ...german }))).toBe(current);
  });

  it('keeps the loaded layout when reading the new one fails', () => {
    const current = { status: 'loaded', value: german } as const;

    expect(afterLayoutChange(current, err(failed))).toBe(current);
  });

  it('recovers from a failed start once a layout reads', () => {
    expect(afterLayoutChange({ status: 'failed', error: failed }, ok(us))).toStrictEqual({
      status: 'loaded',
      value: us,
    });
  });
});
