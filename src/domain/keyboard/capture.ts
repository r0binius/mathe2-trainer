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
  if (modifierCodes.includes(press.code)) {
    return undefined;
  }

  const held = [
    press.control ? 'Control' : undefined,
    press.alt ? 'Alt' : undefined,
    press.shift ? 'Shift' : undefined,
    press.meta ? 'Meta' : undefined,
  ].filter((modifier) => modifier !== undefined);

  return orderModifiersFirst([...held, keyOf(keymap, press.code)]);
}
