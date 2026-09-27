import { describe, expect, it } from 'vitest';

import { shortcutId } from './shortcutId';

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
