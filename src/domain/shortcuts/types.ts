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

/** The groups the app list is sorted into, in the order it shows them. The UI translates their names. */
export const appCategories = [
  'communication',
  'development',
  'internet',
  'music',
  'productivity',
  'system',
] as const;

/** One of the {@link appCategories}. */
export type AppCategory = (typeof appCategories)[number];

/**
 * An app's texts in one language: message keys, nested by their dotted parts, mapped to the text.
 * @example
 * ```json
 * { "essentials": { "title": "Grundlagen", "newNote": "Neue Notiz" } }
 * ```
 */
export type Catalog = { readonly [key: string]: string | Catalog };

/**
 * An app, its shortcuts and their texts, as written in `src/data/apps/<id>/index.ts`. The data files check
 * their literal with `satisfies`, which keeps it type-checked and autocompleted. Rules that types
 * can't express, such as unique IDs, keys that exist and message keys that are in the catalog, are
 * checked by the data health test.
 * @example
 * ```ts
 * import de from './de.json';
 * import en from './en.json';
 *
 * export const rectangle = {
 *   id: 'rectangle',
 *   title: 'Rectangle',
 *   bundleIds: ['com.knollsoft.Rectangle'],
 *   category: 'system',
 *   catalogs: { de, en },
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
  /**
   * The app's name as its vendor ships it in English. Where the vendor translates it, as Apple
   * does Notes, a catalog's `appTitle` names it in that language.
   */
  readonly title: string;
  /**
   * The bundle IDs of the app's builds, such as `com.apple.Notes`, by which the popover recognizes
   * it in front. The health test keeps them unique.
   */
  readonly bundleIds: readonly string[];
  readonly category: AppCategory;
  /**
   * The texts its message keys point to, in every language the UI speaks. The health test keeps
   * their entries the same.
   */
  readonly catalogs: { readonly de: Catalog; readonly en: Catalog };
  readonly sets: readonly ShortcutSet[];
};
