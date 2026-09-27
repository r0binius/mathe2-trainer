/** How a key is shown: a large symbol, and for some keys a small name like the one on its keycap. */
export type KeyLabel = {
  readonly symbol: string;
  readonly name?: string;
};

/**
 * A platform's labels for keys that aren't shown as the character they type, by key name
 * (`'Meta'`, `'ArrowUp'`).
 */
export type KeyLabels = Readonly<Record<string, KeyLabel>>;

/**
 * The macOS symbols, as in its menus, plus the names of the keycaps that the old app showed.
 *
 * The names stay English, like the keycaps of German Mac keyboards.
 * @see `keyboard-symbol` and `components/Key` in the old app
 */
export const macosKeyLabels: KeyLabels = {
  Control: { symbol: '⌃', name: 'Ctrl' },
  Alt: { symbol: '⌥', name: 'Alt' },
  Shift: { symbol: '⇧', name: 'Shift' },
  Meta: { symbol: '⌘', name: 'Cmd' },
  CapsLock: { symbol: '⇪' },
  Escape: { symbol: '⎋', name: 'Esc' },
  Tab: { symbol: '⇥', name: 'Tab' },
  Space: { symbol: '␣', name: 'Space' },
  Enter: { symbol: '↩', name: 'Enter' },
  Backspace: { symbol: '⌫', name: 'Back' },
  Delete: { symbol: '⌦', name: 'Delete' },
  ArrowUp: { symbol: '↑' },
  ArrowRight: { symbol: '→' },
  ArrowDown: { symbol: '↓' },
  ArrowLeft: { symbol: '←' },
  Home: { symbol: '↖' },
  End: { symbol: '↘' },
  PageUp: { symbol: '⇞', name: 'Page Up' },
  PageDown: { symbol: '⇟', name: 'Page Down' },
  Numpad0: { symbol: '0', name: 'Numpad' },
};

// A single character is shown uppercase, like on a keycap, unless its uppercase form is longer:
// 'ß'.toUpperCase() is 'SS'. Longer names (`F5`) are kept as they are.
function uppercaseCharacter(key: string): string {
  const uppercase = key.toUpperCase();

  return key.length === 1 && uppercase.length === 1 ? uppercase : key;
}

/**
 * How to show a key of a resolved combination.
 *
 * A key in the labels gets its label, any other key its uppercase character or its name.
 * @example
 * ```ts
 * labelKey(macosKeyLabels, 'Meta'); // { symbol: '⌘', name: 'Cmd' }
 * labelKey(macosKeyLabels, 'k'); // { symbol: 'K' }
 * ```
 */
export function labelKey(labels: KeyLabels, key: string): KeyLabel {
  // `hasOwn`, because a key such as `constructor` would otherwise find Object's.
  const label = Object.hasOwn(labels, key) ? labels[key] : undefined;

  return label ?? { symbol: uppercaseCharacter(key) };
}
