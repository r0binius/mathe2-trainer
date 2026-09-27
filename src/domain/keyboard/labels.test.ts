import { describe, expect, it } from 'vitest';

import { labelKey, macosKeyLabels } from './labels';

describe('labelKey', () => {
  describe('with the macOS labels', () => {
    it('shows a modifier as its symbol with its keycap name', () => {
      expect(labelKey(macosKeyLabels, 'Meta')).toStrictEqual({ symbol: '⌘', name: 'Cmd' });
    });

    it('shows a key with a well-known symbol as that symbol only', () => {
      expect(labelKey(macosKeyLabels, 'ArrowUp')).toStrictEqual({ symbol: '↑' });
    });

    it('shows Home and End as the symbols of macOS menus', () => {
      expect(labelKey(macosKeyLabels, 'Home')).toStrictEqual({ symbol: '↖' });
      expect(labelKey(macosKeyLabels, 'End')).toStrictEqual({ symbol: '↘' });
    });

    it('names a numpad key, so it looks different from the main keyboard one', () => {
      expect(labelKey(macosKeyLabels, 'Numpad0')).toStrictEqual({ symbol: '0', name: 'Numpad' });
    });
  });

  it('uppercases a character', () => {
    expect(labelKey(macosKeyLabels, 'k')).toStrictEqual({ symbol: 'K' });
    expect(labelKey(macosKeyLabels, 'ä')).toStrictEqual({ symbol: 'Ä' });
  });

  it('keeps a character whose uppercase form is longer', () => {
    // 'ß'.toUpperCase() is 'SS', which is not what the key shows.
    expect(labelKey(macosKeyLabels, 'ß')).toStrictEqual({ symbol: 'ß' });
  });

  it('keeps a character without an uppercase form', () => {
    expect(labelKey(macosKeyLabels, '?')).toStrictEqual({ symbol: '?' });
  });

  it('keeps the name of a key without a label', () => {
    expect(labelKey(macosKeyLabels, 'F5')).toStrictEqual({ symbol: 'F5' });
  });

  it('ignores keys the table inherits from Object', () => {
    expect(labelKey({}, 'constructor')).toStrictEqual({ symbol: 'constructor' });
  });
});
