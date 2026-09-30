import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, ok } from '../shared/result';
import germanKeymap from './germanKeymap.fixture.json';
import type { KeyCode, Keymap } from './keymap';
import { decodeCurrentLayout } from './keymap';

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
