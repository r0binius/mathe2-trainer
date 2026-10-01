import type { KeyAlternatives, KeyCombination } from '../keyboard/combination';
import type { Keymap } from '../keyboard/keymap';
import { lookupPolicy, practicableKeys } from '../keyboard/policy';
import type { AppDefinition, MessageKey } from '../shortcuts/types';
import type { MenuGroup } from './menuShortcuts';
import type { SearchGroup } from './search';

/** A shortcut as the popover lists it: its title, and the keys to press on the current layout. */
export type LookupRow = {
  readonly title: string;
  readonly keys: KeyCombination;
};

/** Rows under the title of their menu or set. */
export type LookupGroup = SearchGroup<LookupRow>;

/**
 * The menu shortcuts as rows, their keys resolved on the layout like a built-in set's. Shortcuts
 * that can't be pressed there are left out, and so are menus left without any.
 */
export function menuGroups(groups: readonly MenuGroup[], keymap: Keymap): readonly LookupGroup[] {
  return withRows(
    groups.map(({ title, shortcuts }) => ({
      title,
      items: shortcuts.flatMap((shortcut) => rowOf(shortcut.title, [shortcut.keys], keymap)),
    })),
  );
}

/**
 * An app's built-in sets as rows, with their titles in the UI's language (`translate`, given the
 * app's message keys), and each shortcut's shortest alternative that can be pressed on the layout.
 */
export function builtInGroups(
  app: AppDefinition,
  keymap: Keymap,
  translate: (key: MessageKey) => string,
): readonly LookupGroup[] {
  return withRows(
    app.sets.map((set) => ({
      title: translate(set.title),
      items: set.shortcuts.flatMap((shortcut) =>
        rowOf(translate(shortcut.title), shortcut.keys, keymap),
      ),
    })),
  );
}

function rowOf(title: string, alternatives: KeyAlternatives, keymap: Keymap): readonly LookupRow[] {
  const keys = practicableKeys(keymap, alternatives, lookupPolicy);

  return keys === undefined ? [] : [{ title, keys }];
}

function withRows(groups: readonly LookupGroup[]): readonly LookupGroup[] {
  return groups.filter((group) => group.items.length > 0);
}
