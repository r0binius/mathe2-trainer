import type { KeyCombination } from '../keyboard/combination';
import { appPracticeItems } from '../practice/items';
import type { SummaryContext } from '../progress/summary';
import { summarizeSet } from '../progress/summary';
import type { Decoder } from '../shared/decode';
import { object } from '../shared/decode';
import type { ShortcutId } from '../shortcuts/shortcutId';
import { decodeShortcutId } from '../shortcuts/shortcutId';
import type { AppDefinition } from '../shortcuts/types';

/** A learned shortcut whose key presses the Rust side counts, in the app it belongs to. */
export type WatchedShortcut = {
  readonly id: ShortcutId;
  /** The bundle IDs of its app, which has to be in front for a press to count. */
  readonly bundleIds: readonly string[];
  /** Its keys on the current layout. */
  readonly keys: KeyCombination;
};

/**
 * The shortcuts whose presses count as use: those learned on the current layout, each with its
 * app's bundle IDs and its keys there. Apps without a bundle ID are left out, since their
 * shortcuts work in whatever app is in front.
 */
export function watchedShortcuts(
  apps: readonly AppDefinition[],
  context: SummaryContext,
): readonly WatchedShortcut[] {
  return apps
    .filter(({ bundleIds }) => bundleIds.length > 0)
    .flatMap((app) => {
      const learned = new Set(
        app.sets.flatMap((set) => summarizeSet(app.id, set, context).learned),
      );

      return appPracticeItems(app, context)
        .filter(({ id }) => learned.has(id))
        .map(({ id, keys }) => ({ id, bundleIds: app.bundleIds, keys }));
    });
}

/** A press of a watched shortcut, as the `key-used` event carries it. */
export type KeyUsed = { readonly id: ShortcutId };

/** Decodes the `key-used` event's payload. */
export const decodeKeyUsed: Decoder<KeyUsed> = object({ id: decodeShortcutId });
