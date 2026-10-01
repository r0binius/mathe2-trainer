import type { KeyCombination } from '../keyboard/combination';
import type { DecodeError, Decoder } from '../shared/decode';
import { andThen, array, object, string } from '../shared/decode';
import type { Result } from '../shared/result';
import { err, ok } from '../shared/result';

/** A shortcut in an app's menus, titled as the menu item is, in the system's language. */
export type MenuShortcut = {
  readonly title: string;
  /** Named as in the shortcut data, so the keyboard layout resolves them like a built-in set's. */
  readonly keys: KeyCombination;
};

/** The shortcuts in one of an app's menus, such as File, those of its submenus included. */
export type MenuGroup = {
  readonly title: string;
  readonly shortcuts: readonly MenuShortcut[];
};

function nonEmpty(keys: readonly string[]): Result<KeyCombination, DecodeError> {
  return keys.length > 0 ? ok(keys) : err({ path: '', expected: 'at least one key' });
}

/** Decodes the menu shortcuts that `read_menu_shortcuts` answers with, by menu. */
export const decodeMenuGroups: Decoder<readonly MenuGroup[]> = array(
  object({
    title: string,
    shortcuts: array(object({ title: string, keys: andThen(array(string), nonEmpty) })),
  }),
);
