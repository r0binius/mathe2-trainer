import type { KeyCharacters, Keymap } from './keymap';
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

function findOnLayer(keymap: Keymap, layer: Layer, key: string): KeyCombination | undefined {
  const characters = mainKeyCodes
    .map((code) => keymap[code])
    .find((candidate) => candidate?.[layer.field] === key);

  return characters === undefined ? undefined : [...layer.modifiers, characters.value];
}

function resolveKey(keymap: Keymap, key: string): KeyCombination {
  const matches = layers.map((layer) => findOnLayer(keymap, layer, key));

  return matches.find((match) => match !== undefined) ?? [key];
}

function isModifier(key: string): boolean {
  return modifierOrder.some((modifier) => modifier === key);
}

/** Puts the modifiers first, sorted ⌃⌥⇧⌘, and keeps the other keys in their order. */
export function orderModifiersFirst(keys: KeyCombination): KeyCombination {
  return [
    ...modifierOrder.flatMap((modifier) => keys.filter((key) => key === modifier)),
    ...keys.filter((key) => !isModifier(key)),
  ];
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
