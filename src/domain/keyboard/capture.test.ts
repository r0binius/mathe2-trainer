import { describe, expect, it } from 'vitest';

import type { KeyPress } from './capture';
import { combinationOf, heldKeysOf, heldModifiersOf } from './capture';
import germanKeymap from './germanKeymap.fixture.json';
import { resolveKeys } from './resolve';

function press(code: string, held: Partial<Omit<KeyPress, 'code'>> = {}): KeyPress {
  return { code, control: false, alt: false, shift: false, meta: false, ...held };
}

describe('combinationOf', () => {
  it('names the key the way key resolution does, modifiers first in ⌃⌥⇧⌘ order', () => {
    expect(combinationOf(germanKeymap, press('KeyY', { meta: true, control: true }))).toStrictEqual(
      ['Control', 'Meta', 'z'],
    );
  });

  it('captures what a shortcut resolves to, for a character typed with a modifier', () => {
    const captured = combinationOf(germanKeymap, press('Minus', { shift: true, meta: true }));

    expect(captured).toStrictEqual(resolveKeys(germanKeymap, ['Meta', '?']));
  });

  it('names the space bar, the numpad and keys without characters by their code', () => {
    expect(combinationOf(germanKeymap, press('Space', { control: true }))).toStrictEqual([
      'Control',
      'Space',
    ]);
    expect(combinationOf(germanKeymap, press('Numpad1', { alt: true }))).toStrictEqual([
      'Alt',
      'Numpad1',
    ]);
    expect(combinationOf(germanKeymap, press('F6'))).toStrictEqual(['F6']);
  });

  it('waits for the key when only a modifier is pressed', () => {
    expect(combinationOf(germanKeymap, press('MetaLeft', { meta: true }))).toBeUndefined();
    expect(combinationOf(germanKeymap, press('ShiftRight', { shift: true }))).toBeUndefined();
  });
});

describe('heldKeysOf', () => {
  it('shows the modifiers alone while only they are down', () => {
    expect(heldKeysOf(germanKeymap, press('MetaLeft', { meta: true, shift: true }))).toStrictEqual([
      'Shift',
      'Meta',
    ]);
  });

  it('adds the key once it goes down, named as in an answer', () => {
    expect(heldKeysOf(germanKeymap, press('KeyY', { meta: true }))).toStrictEqual(['Meta', 'z']);
  });

  it('holds nothing when a released modifier was the last key down', () => {
    expect(heldKeysOf(germanKeymap, press('MetaLeft'))).toStrictEqual([]);
  });
});

describe('heldModifiersOf', () => {
  it('keeps only the modifiers still down, as after a key goes up', () => {
    expect(heldModifiersOf(press('KeyY', { control: true, meta: true }))).toStrictEqual([
      'Control',
      'Meta',
    ]);
  });
});
