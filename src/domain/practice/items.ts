import type { KeyCombination } from '../keyboard/combination';
import type { Keymap } from '../keyboard/keymap';
import type { ShortcutPolicy } from '../keyboard/policy';
import { practicableKeys } from '../keyboard/policy';
import type { Card } from '../scheduling/scheduler';
import { shortcutId } from '../shortcuts/shortcutId';
import type { AppDefinition, ShortcutDefinition, ShortcutSet } from '../shortcuts/types';
import type { PracticeItem } from './session';

/** What deciding how to practice a shortcut depends on: the layout and the practice policy. */
export type PracticeContext = {
  readonly keymap: Keymap;
  readonly policy: ShortcutPolicy;
};

/**
 * The set's shortcuts to practice on this layout. A shortcut that no alternative lets you
 * practice, because it's reserved or can't be pressed, is left out; its progress is kept.
 */
export function practiceItems(
  appId: string,
  set: ShortcutSet,
  { keymap, policy }: PracticeContext,
): readonly PracticeItem[] {
  return set.shortcuts.flatMap((shortcut) => {
    const keys = practicableKeys(keymap, shortcut.keys, policy);

    return keys === undefined ? [] : [itemOf(appId, shortcut, keys)];
  });
}

/** Every set's items of an app, once per shortcut: sets that share keys share the shortcut. */
export function appPracticeItems(
  app: AppDefinition,
  context: PracticeContext,
): readonly PracticeItem[] {
  const items = app.sets.flatMap((set) => practiceItems(app.id, set, context));

  return items.filter((item, index) => items.findIndex(({ id }) => id === item.id) === index);
}

/**
 * The review queue: the items of the due cards, in the cards' order. Cards without an item are
 * left out: they belong to another app, or their shortcut was removed or can't be practiced here.
 */
export function reviewItems(
  due: readonly Card[],
  items: readonly PracticeItem[],
): readonly PracticeItem[] {
  return due.flatMap((card) => items.filter(({ id }) => id === card.id));
}

function itemOf(appId: string, shortcut: ShortcutDefinition, keys: KeyCombination): PracticeItem {
  const item = { id: shortcutId(appId, shortcut.keys), keys, title: shortcut.title };

  return shortcut.description === undefined ? item : { ...item, description: shortcut.description };
}
