import type { KeyCombination } from '../keyboard/combination';
import { isSameCombination } from '../keyboard/combination';
import { lookupPolicy, practicableKeys } from '../keyboard/policy';
import type { PracticeContext } from '../practice/items';
import { appPracticeItems } from '../practice/items';
import type { PracticeItem } from '../practice/session';
import type { Decoder } from '../shared/decode';
import { array, object, string } from '../shared/decode';
import { findAppByBundleId } from '../shortcuts/lookup';
import type { AppDefinition } from '../shortcuts/types';

/**
 * A menu item with a shortcut the user chose, as the Rust side reports it while learning from
 * work is on: the app's bundle ID, and the item's keys named as in the shortcut data.
 */
export type MenuChoice = {
  readonly bundleId: string;
  readonly keys: KeyCombination;
};

/** Decodes the `menu-chosen` event's payload. */
export const decodeMenuChoice: Decoder<MenuChoice> = object({
  bundleId: string,
  keys: array(string),
});

/** The shortcut of Mouseless's data a menu choice used, and its app. */
export type MenuMatch = {
  readonly app: AppDefinition;
  readonly item: PracticeItem;
};

/**
 * The shortcut of Mouseless's data that a menu choice used, or `undefined` if Mouseless has no
 * sets for the app or no shortcut with those keys. The menu's keys are resolved on the layout as
 * the popover resolves them, and compared with the app's practice items.
 */
export function matchMenuChoice(
  apps: readonly AppDefinition[],
  { bundleId, keys }: MenuChoice,
  context: PracticeContext,
): MenuMatch | undefined {
  const app = findAppByBundleId(apps, bundleId);
  const pressed = practicableKeys(context.keymap, [keys], lookupPolicy);
  const item =
    app === undefined || pressed === undefined
      ? undefined
      : appPracticeItems(app, context).find((practiced) =>
          isSameCombination(practiced.keys, pressed),
        );

  return app === undefined || item === undefined ? undefined : { app, item };
}
