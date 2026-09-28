import type { KeyCombination } from './combination';
import { orderModifiersFirst } from './combination';
import type { Keymap } from './keymap';
import { keyOf } from './resolve';

/** A key going down, as a `KeyboardEvent` reports it: the physical key and the modifiers held. */
export type KeyPress = {
  /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | code}. */
  readonly code: string;
  readonly control: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
};

// Pressing one of these alone doesn't finish a combination: the key that goes with it follows.
const modifierCodes: readonly string[] = [
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
  'MetaLeft',
  'MetaRight',
];

/**
 * The combination a key press makes on the given keymap, named like resolved keys (see
 * {@link keyOf}), or `undefined` while only a modifier is down.
 * @example
 * ```ts
 * combinationOf(germanKeymap, { code: 'Minus', shift: true, meta: true, … }); // ['Shift', 'Meta', 'ß']
 * ```
 */
export function combinationOf(keymap: Keymap, press: KeyPress): KeyCombination | undefined {
  return isModifierCode(press.code) ? undefined : heldKeysOf(keymap, press);
}

/**
 * What's down during a key press, to show while a combination is being pressed: the modifiers
 * held and, unless the key is one of them, the key itself, named as in {@link combinationOf}.
 */
export function heldKeysOf(keymap: Keymap, press: KeyPress): KeyCombination {
  const modifiers = heldModifiersOf(press);

  return isModifierCode(press.code)
    ? modifiers
    : orderModifiersFirst([...modifiers, keyOf(keymap, press.code)]);
}

/** The modifiers down during a key event, such as those still held after a key went up. */
export function heldModifiersOf(press: KeyPress): KeyCombination {
  return [
    press.control ? 'Control' : undefined,
    press.alt ? 'Alt' : undefined,
    press.shift ? 'Shift' : undefined,
    press.meta ? 'Meta' : undefined,
  ].filter((modifier) => modifier !== undefined);
}

function isModifierCode(code: string): boolean {
  return modifierCodes.includes(code);
}
