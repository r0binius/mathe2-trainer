import { describe, expect, it } from 'vitest';

import germanKeymap from './germanKeymap.fixture.json';
import { keyOf, resolveKeys } from './resolve';
import usKeymap from './usKeymap.fixture.json';

describe('resolveKeys', () => {
  describe('on a German keymap', () => {
    it('keeps a character the key types without a modifier', () => {
      expect(resolveKeys(germanKeymap, ['Meta', 'k'])).toStrictEqual(['Meta', 'k']);
    });

    it('adds Shift for a character typed with Shift', () => {
      expect(resolveKeys(germanKeymap, ['Meta', '?'])).toStrictEqual(['Shift', 'Meta', 'ß']);
    });

    it('adds Alt for a character typed with Alt', () => {
      expect(resolveKeys(germanKeymap, ['Meta', '@'])).toStrictEqual(['Alt', 'Meta', 'l']);
    });

    it('adds Shift and Alt for a character typed with both', () => {
      expect(resolveKeys(germanKeymap, ['Meta', '\\'])).toStrictEqual([
        'Alt',
        'Shift',
        'Meta',
        '7',
      ]);
    });

    it('prefers a key typing the character without a modifier over one needing modifiers', () => {
      // `^` is the value of IntlBackslash and the Shift+Alt character of Digit6.
      expect(resolveKeys(germanKeymap, ['^'])).toStrictEqual(['^']);
    });

    it('keeps a key the keymap does not type, such as a key code', () => {
      expect(resolveKeys(germanKeymap, ['Control', 'ArrowLeft'])).toStrictEqual([
        'Control',
        'ArrowLeft',
      ]);
    });

    it('resolves numpad characters to the main keyboard', () => {
      // `*` is the value of NumpadMultiply, but Shift + `+` on the main keyboard.
      expect(resolveKeys(germanKeymap, ['Meta', '*'])).toStrictEqual(['Shift', 'Meta', '+']);
    });

    it('keeps a numpad key given by its code', () => {
      expect(resolveKeys(germanKeymap, ['Meta', 'Numpad0'])).toStrictEqual(['Meta', 'Numpad0']);
    });

    it('keeps a duplicated modifier for the shortcut policy to reject', () => {
      expect(resolveKeys(germanKeymap, ['Shift', '?'])).toStrictEqual(['Shift', 'Shift', 'ß']);
    });
  });

  describe('on a US keymap, of an ANSI keyboard', () => {
    it('resolves the same definition to the keys this layout types it with', () => {
      expect(resolveKeys(usKeymap, ['Meta', '?'])).toStrictEqual(['Shift', 'Meta', '/']);
      expect(resolveKeys(usKeymap, ['Meta', '@'])).toStrictEqual(['Shift', 'Meta', '2']);
      expect(resolveKeys(usKeymap, ['Meta', '\\'])).toStrictEqual(['Meta', '\\']);
    });

    it('keeps Y and Z where the US layout has them', () => {
      expect(resolveKeys(usKeymap, ['Meta', 'z'])).toStrictEqual(['Meta', 'z']);
    });

    it('types `<` with Shift, since an ANSI keyboard has no key left of Z', () => {
      expect(resolveKeys(usKeymap, ['Meta', '<'])).toStrictEqual(['Shift', 'Meta', ',']);
    });

    it('adds Alt for a character typed with Option', () => {
      expect(resolveKeys(usKeymap, ['Meta', 'ß'])).toStrictEqual(['Alt', 'Meta', 's']);
    });

    it('keeps a character the layout does not type, such as a German umlaut', () => {
      expect(resolveKeys(usKeymap, ['Meta', 'ö'])).toStrictEqual(['Meta', 'ö']);
    });
  });

  describe('modifier order', () => {
    it('sorts modifiers as Control, Alt, Shift, Meta', () => {
      expect(resolveKeys(germanKeymap, ['Meta', 'Shift', 'Alt', 'Control', 'k'])).toStrictEqual([
        'Control',
        'Alt',
        'Shift',
        'Meta',
        'k',
      ]);
    });

    it('puts modifiers before the other keys and keeps the order of the other keys', () => {
      expect(resolveKeys(germanKeymap, ['k', 'Meta', 'ArrowUp', 'Control'])).toStrictEqual([
        'Control',
        'Meta',
        'k',
        'ArrowUp',
      ]);
    });
  });

  it('prefers the earlier key code when two keys type the same character', () => {
    const keymap = {
      KeyB: { value: 'b', withShift: 'x', withAlt: '', withShiftAlt: '' },
      KeyA: { value: 'a', withShift: 'x', withAlt: '', withShiftAlt: '' },
    };

    expect(resolveKeys(keymap, ['x'])).toStrictEqual(['Shift', 'a']);
  });
});

describe('keyOf', () => {
  it('names a main key by the character it types without a modifier', () => {
    expect(keyOf(germanKeymap, 'KeyY')).toBe('z');
    expect(keyOf(germanKeymap, 'Minus')).toBe('ß');
  });

  it('names the space bar and the numpad by their code, as the data does', () => {
    expect(keyOf(germanKeymap, 'Space')).toBe('Space');
    expect(keyOf(germanKeymap, 'Numpad1')).toBe('Numpad1');
  });

  it('names a key the keymap does not type by its code', () => {
    expect(keyOf(germanKeymap, 'ArrowUp')).toBe('ArrowUp');
    expect(keyOf({}, 'KeyA')).toBe('KeyA');
  });
});

describe('resolving the space bar', () => {
  it('names a character typed by the space bar Space, as capture does', () => {
    expect(resolveKeys(germanKeymap, ['Control', ' '])).toStrictEqual(['Control', 'Space']);
  });
});
