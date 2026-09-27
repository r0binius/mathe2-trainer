import type { KeyCombination } from '../keyboard/resolve';
import { orderModifiersFirst } from '../keyboard/resolve';

/**
 * Identifies a shortcut of an app, such as `vscodium/Meta+k|Meta+t`. Progress is keyed by it.
 */
export type ShortcutId = `${string}/${string}`;

/**
 * Builds the ID of a shortcut from its app and the keys of its definition.
 *
 * It uses the definition keys rather than the resolved ones, so the ID is the same on every
 * keyboard layout. The title and the set aren't part of it: renaming a shortcut keeps its progress,
 * and the same keys in two sets of one app share it. Changing the keys gives a new ID. Modifiers
 * and alternatives are put in a fixed order, so the order they're written in doesn't matter.
 * @see §7.2 of `docs/legacy-architecture.md` for the old app's hashed IDs this replaces
 */
export function shortcutId(
  appId: string,
  alternatives: readonly [KeyCombination, ...KeyCombination[]],
): ShortcutId {
  const combinations = alternatives.map((keys) => orderModifiersFirst(keys).join('+'));

  // Default sort compares UTF-16 code units, which, unlike `localeCompare`, is the same everywhere.
  return `${appId}/${[...combinations].sort().join('|')}`;
}
