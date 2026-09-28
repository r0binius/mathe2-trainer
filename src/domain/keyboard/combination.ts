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

// macOS order, per Apple's Human Interface Guidelines: ⌃ ⌥ ⇧ ⌘.
const modifierOrder = ['Control', 'Alt', 'Shift', 'Meta'] as const;

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
