import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { decodeShortcutId, shortcutId } from './shortcutId';

describe('shortcutId', () => {
  it('joins the app ID and the keys', () => {
    expect(shortcutId('rectangle', [['Control', 'Alt', 'ArrowLeft']])).toBe(
      'rectangle/Control+Alt+ArrowLeft',
    );
  });

  it('is the same whatever order the modifiers are written in', () => {
    expect(shortcutId('vscodium', [['Shift', 'Meta', 'k']])).toBe(
      shortcutId('vscodium', [['Meta', 'Shift', 'k']]),
    );
  });

  it('uses the definition keys, so it is the same on every keyboard layout', () => {
    expect(shortcutId('vscodium', [['Meta', '?']])).toBe('vscodium/Meta+?');
  });

  it('joins alternatives in sorted order', () => {
    expect(
      shortcutId('vscodium', [
        ['Meta', 't'],
        ['Meta', 'k'],
      ]),
    ).toBe('vscodium/Meta+k|Meta+t');
  });
});

describe('decodeShortcutId', () => {
  it('accepts an app ID and keys joined by a slash', () => {
    expect(decodeShortcutId('rectangle/Control+Alt+ArrowLeft')).toStrictEqual(
      ok('rectangle/Control+Alt+ArrowLeft'),
    );
  });

  it('rejects a string without the slash, or no string', () => {
    const expected = err({ path: '', expected: 'a shortcut ID' });

    expect(decodeShortcutId('rectangle')).toStrictEqual(expected);
    expect(decodeShortcutId(1)).toStrictEqual(err({ path: '', expected: 'a string' }));
  });
});
