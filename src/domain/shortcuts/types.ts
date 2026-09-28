import type { KeyAlternatives } from '../keyboard/combination';

/**
 * A key into the app's catalogs (`src/data/apps/<id>/<locale>.json`), such as `essentials.find`.
 *
 * Text shown to the user is written as a key, so the data stays the same in every language. The
 * data health test checks that each key is in the German catalog.
 */
export type MessageKey = string;

/**
 * One shortcut to learn. Its keys name characters, not physical keys, so the same definition works
 * on every layout.
 */
export type ShortcutDefinition = {
  readonly title: MessageKey;
  /** Shown below the title, when the title alone doesn't explain what the shortcut does. */
  readonly description?: MessageKey;
  /**
   * Every combination that triggers the shortcut. The one with the fewest keys on the current
   * layout is the one to learn.
   */
  readonly keys: KeyAlternatives;
};

/** A group of shortcuts of one app that is learned together, such as its basics. */
export type ShortcutSet = {
  /** Unique within its app. */
  readonly id: string;
  readonly title: MessageKey;
  readonly shortcuts: readonly ShortcutDefinition[];
};

/** The groups the app list is sorted into. The UI translates their names. */
export type AppCategory =
  'communication' | 'development' | 'internet' | 'music' | 'productivity' | 'system';

/**
 * An app and its shortcuts, as written in `src/data/apps/<id>/index.ts`. The data files check
 * their literal with `satisfies`, which keeps it type-checked and autocompleted. Rules that types
 * can't express, such as unique IDs, keys that exist and message keys that are in the catalog, are
 * checked by the data health test.
 * @example
 * ```ts
 * export const rectangle = {
 *   id: 'rectangle',
 *   title: 'Rectangle',
 *   category: 'system',
 *   sets: [
 *     {
 *       id: 'halves',
 *       title: 'halves.title',
 *       shortcuts: [{ title: 'halves.left', keys: [['Control', 'Alt', 'ArrowLeft']] }],
 *     },
 *   ],
 * } satisfies AppDefinition;
 * ```
 */
export type AppDefinition = {
  /** Unique, and the first part of every `ShortcutId` of the app. */
  readonly id: string;
  /** The app's product name, which isn't translated. */
  readonly title: string;
  readonly category: AppCategory;
  readonly sets: readonly ShortcutSet[];
};
