import { describe, expect, it } from 'vitest';

import { isModifier, isSameCombination, orderModifiersFirst } from './combination';

describe('isModifier', () => {
  it('knows the four modifiers by name', () => {
    expect(['Control', 'Alt', 'Shift', 'Meta'].every(isModifier)).toBe(true);
    expect(isModifier('k')).toBe(false);
    expect(isModifier('MetaLeft')).toBe(false);
  });
});

describe('orderModifiersFirst', () => {
  it('sorts the modifiers ⌃⌥⇧⌘ before the other keys, which keep their order', () => {
    expect(orderModifiersFirst(['k', 'Meta', 'ArrowUp', 'Shift', 'Control'])).toStrictEqual([
      'Control',
      'Shift',
      'Meta',
      'k',
      'ArrowUp',
    ]);
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
