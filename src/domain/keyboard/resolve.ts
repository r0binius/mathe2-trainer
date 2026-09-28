import type { KeyCharacters, KeyCode, Keymap } from './keymap';
import { keyCodes } from './keymap';

/**
 * Keys pressed together, such as `['Shift', 'Meta', 'ß']`.
 *
 * Modifiers are named `Control`, `Alt`, `Shift` and `Meta`. Other keys are either a character
 * (`'k'`, `'?'`) or, for keys that type nothing, a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | KeyboardEvent.code}
 * (`'ArrowUp'`, `'F6'`).
 */
export type KeyCombination = readonly string[];

/** The combinations that trigger the same shortcut, at least one. */
export type KeyAlternatives = readonly [KeyCombination, ...KeyCombination[]];

/** One of the ways a key types characters: which character it types and what has to be held. */
type Layer = {
  readonly field: keyof KeyCharacters;
  readonly modifiers: KeyCombination;
};

// Searched in this order, so a character typed without a modifier wins over one needing Shift.
const layers: readonly Layer[] = [
  { field: 'value', modifiers: [] },
  { field: 'withShift', modifiers: ['Shift'] },
  { field: 'withAlt', modifiers: ['Alt'] },
  { field: 'withShiftAlt', modifiers: ['Shift', 'Alt'] },
];

// macOS order, per Apple's Human Interface Guidelines: ⌃ ⌥ ⇧ ⌘.
const modifierOrder = ['Control', 'Alt', 'Shift', 'Meta'] as const;

// The numpad is left out so that `+ - * /` resolve to the main keyboard. Its digits type the same
// characters as the main keyboard's, so leaving them out doesn't change anything else.
const mainKeyCodes = keyCodes.filter((code) => !code.startsWith('Numpad'));

function isKeyCode(code: string): code is KeyCode {
  return keyCodes.some((keyCode) => keyCode === code);
}

// The data names these keys by their code: the space bar's character is a space, and the numpad
// types the same characters as the main keys, which the data uses instead.
function isNamedByCode(code: KeyCode): boolean {
  return code === 'Space' || code.startsWith('Numpad');
}

/**
 * How a physical key is named in a {@link KeyCombination} on the given keymap: by the character it
 * types without a modifier, or by its code for the space bar, the numpad and keys that type
 * nothing. Key resolution and key capture both name keys this way, so a correct press matches.
 * @example
 * ```ts
 * keyOf(germanKeymap, 'KeyY'); // 'z'
 * keyOf(germanKeymap, 'Space'); // 'Space'
 * ```
 */
export function keyOf(keymap: Keymap, code: string): string {
  const characters = isKeyCode(code) && !isNamedByCode(code) ? keymap[code] : undefined;

  return characters?.value ?? code;
}

function findOnLayer(keymap: Keymap, layer: Layer, key: string): KeyCombination | undefined {
  const code = mainKeyCodes.find((candidate) => keymap[candidate]?.[layer.field] === key);

  return code === undefined ? undefined : [...layer.modifiers, keyOf(keymap, code)];
}

function resolveKey(keymap: Keymap, key: string): KeyCombination {
  const matches = layers.map((layer) => findOnLayer(keymap, layer, key));

  return matches.find((match) => match !== undefined) ?? [key];
}

/** Whether the key is one of `Control`, `Alt`, `Shift` and `Meta`. */
export function isModifier(key: string): boolean {
  return modifierOrder.some((modifier) => modifier === key);
}

/** Puts the modifiers first, sorted ⌃⌥⇧⌘, and keeps the other keys in their order. */
export function orderModifiersFirst(keys: KeyCombination): KeyCombination {
  return [
    ...modifierOrder.flatMap((modifier) => keys.filter((key) => key === modifier)),
    ...keys.filter((key) => !isModifier(key)),
  ];
}

/** Whether two combinations hold the same keys, in any order. */
export function isSameCombination(first: KeyCombination, second: KeyCombination): boolean {
  return first.length === second.length && first.every((key) => second.includes(key));
}

/**
 * Turns the keys of a shortcut definition into the keys to press on the given keymap.
 *
 * A character is replaced by the key typing it plus the modifiers that key needs, searching all
 * keys without a modifier first, then with Shift, Alt, and Shift + Alt. Keys the keymap doesn't
 * type are kept. Modifiers are then sorted ⌃⌥⇧⌘ and put first. Duplicates are kept, so the
 * shortcut policy can reject a combination such as Shift + `?`.
 * @see `resolveCodesFromKeys` in the old app's `services/Keyboard.js`
 * @example
 * ```ts
 * resolveKeys(germanKeymap, ['Meta', '?']); // ['Shift', 'Meta', 'ß']
 * ```
 */
export function resolveKeys(keymap: Keymap, keys: KeyCombination): KeyCombination {
  return orderModifiersFirst(keys.flatMap((key) => resolveKey(keymap, key)));
}

/**
 * Resolves each alternative of a shortcut definition and picks the one with the fewest keys.
 *
 * When several are equally short, the first one wins.
 */
export function resolveShortest(keymap: Keymap, alternatives: KeyAlternatives): KeyCombination {
  const [first, ...rest] = alternatives;

  return rest.reduce(
    (shortest, alternative) => {
      const resolved = resolveKeys(keymap, alternative);

      return resolved.length < shortest.length ? resolved : shortest;
    },
    resolveKeys(keymap, first),
  );
}
