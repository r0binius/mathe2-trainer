import { describe, expect, it } from 'vitest';

import germanKeymap from './germanKeymap.fixture.json';
import { isSameCombination, keyOf, resolveKeys, resolveShortest } from './resolve';

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
      // `^` is the value of Backquote and the Shift+Alt character of Digit6.
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

describe('resolveShortest', () => {
  it('picks the alternative with the fewest keys after resolving', () => {
    expect(
      resolveShortest(germanKeymap, [
        ['Meta', '\\'],
        ['Control', 'Alt', 'k'],
      ]),
    ).toStrictEqual(['Control', 'Alt', 'k']);
  });

  it('picks the first alternative when several are equally short', () => {
    expect(
      resolveShortest(germanKeymap, [
        ['Meta', 'k'],
        ['Meta', 't'],
      ]),
    ).toStrictEqual(['Meta', 'k']);
  });

  it('resolves a single alternative', () => {
    expect(resolveShortest(germanKeymap, [['Meta', '?']])).toStrictEqual(['Shift', 'Meta', 'ß']);
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

describe('isSameCombination', () => {
  it('ignores the order of the keys', () => {
    expect(isSameCombination(['Meta', 'Shift', 'k'], ['k', 'Shift', 'Meta'])).toBe(true);
  });

  it('tells combinations with different or extra keys apart', () => {
    expect(isSameCombination(['Meta', 'k'], ['Meta', 'j'])).toBe(false);
    expect(isSameCombination(['Meta', 'k'], ['Shift', 'Meta', 'k'])).toBe(false);
  });
});
