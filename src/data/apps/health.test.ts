import { describe, expect, it } from 'vitest';

import type { KeyPress } from '@/domain/keyboard/capture';
import { combinationOf } from '@/domain/keyboard/capture';
import type { KeyCombination } from '@/domain/keyboard/combination';
import { isModifier, isSameCombination } from '@/domain/keyboard/combination';
import germanKeymap from '@/domain/keyboard/germanKeymap.fixture.json';
import type { Keymap } from '@/domain/keyboard/keymap';
import { keyCodes } from '@/domain/keyboard/keymap';
import { macosKeyLabels } from '@/domain/keyboard/labels';
import type { Rejection } from '@/domain/keyboard/policy';
import { checkShortcut, practicePolicy } from '@/domain/keyboard/policy';
import { keyOf, resolveKeys } from '@/domain/keyboard/resolve';
import { shortcutId } from '@/domain/shortcuts/shortcutId';
import type {
  AppDefinition,
  Catalog,
  ShortcutDefinition,
  ShortcutSet,
} from '@/domain/shortcuts/types';

import { apps } from '../apps';

// Rules that types can't express, checked over the data of every app. Each rule lists all its
// violations, so a failure shows every problem at once.

const keymap: Keymap = germanKeymap;

// Only the folder names: the apps themselves come from the list the app uses.
const folders = Object.keys(import.meta.glob('./*/index.ts')).map((path) => path.split('/')[1]);

type ShortcutEntry = {
  readonly app: AppDefinition;
  readonly set: ShortcutSet;
  readonly shortcut: ShortcutDefinition;
};

const shortcuts: readonly ShortcutEntry[] = apps.flatMap((app) =>
  app.sets.flatMap((set) => set.shortcuts.map((shortcut) => ({ app, set, shortcut }))),
);

function nameOf({ app, shortcut }: ShortcutEntry): string {
  return `${app.id}/${shortcut.title}`;
}

function duplicatesIn(values: readonly string[]): readonly string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

// Keys named by their `KeyboardEvent.code` rather than the character they type.
const namedKeys: ReadonlySet<string> = new Set([
  ...keyCodes,
  ...Object.keys(macosKeyLabels),
  ...Array.from({ length: 20 }, (_, index) => `F${String(index + 1)}`),
]);

// What the German layout types, on the keys that key resolution searches.
const typedCharacters: ReadonlySet<string> = new Set(
  Object.entries(keymap)
    .filter(([code]) => !code.startsWith('Numpad'))
    .flatMap(([, characters]) => Object.values(characters)),
);

function isCharacter(key: string): boolean {
  return key.length === 1;
}

function describeKeys(keys: KeyCombination): string {
  return keys.join('+');
}

// The press that types resolved keys: the physical key named like the key, with its modifiers.
function pressFor(keys: KeyCombination): KeyPress {
  const key = keys.find((candidate) => !isModifier(candidate)) ?? '';

  return {
    code: keyCodes.find((code) => keyOf(keymap, code) === key) ?? key,
    control: keys.includes('Control'),
    alt: keys.includes('Alt'),
    shift: keys.includes('Shift'),
    meta: keys.includes('Meta'),
  };
}

function describeRejection(rejection: Rejection): string {
  switch (rejection.reason) {
    case 'duplicate-key':
      return `${rejection.reason} ${rejection.key}`;
    case 'modifier-only':
    case 'reserved':
      return rejection.reason;
  }
}

// Flattens a nested catalog into `a.b` keys.
function flattenCatalog(catalog: Catalog, prefix = ''): readonly string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;

    return typeof value === 'string' ? [path] : flattenCatalog(value, path);
  });
}

function messageKeysOf(app: AppDefinition): readonly string[] {
  return app.sets.flatMap((set) => [
    set.title,
    ...set.shortcuts.flatMap((shortcut) =>
      shortcut.description === undefined
        ? [shortcut.title]
        : [shortcut.title, shortcut.description],
    ),
  ]);
}

function catalogKeysOf(app: AppDefinition): readonly string[] {
  return flattenCatalog(app.catalogs.de);
}

describe('app data', () => {
  it('lists every app folder in `apps.ts`, each under its app ID', () => {
    // The screens find an app's logo by its folder, so the two have to match.
    expect(apps.map((app) => app.id).sort()).toStrictEqual([...folders].sort());
  });

  it('uses each set ID once per app', () => {
    const duplicates = apps.flatMap((app) =>
      duplicatesIn(app.sets.map((set) => set.id)).map((id) => `${app.id}/${id}`),
    );

    expect(duplicates).toStrictEqual([]);
  });

  it('uses the same keys only once per set', () => {
    // Across sets, the same keys are allowed: they share one shortcut ID and its progress.
    const duplicates = apps.flatMap((app) =>
      app.sets.flatMap((set) =>
        duplicatesIn(set.shortcuts.map((shortcut) => shortcutId(app.id, shortcut.keys))).map(
          (id) => `${app.id}/${set.id}: ${id}`,
        ),
      ),
    );

    expect(duplicates).toStrictEqual([]);
  });

  it('names only known keys', () => {
    const unknown = shortcuts.flatMap((entry) =>
      entry.shortcut.keys
        .flat()
        .filter((key) => !isCharacter(key) && !isModifier(key) && !namedKeys.has(key))
        .map((key) => `${nameOf(entry)}: ${key}`),
    );

    expect(unknown).toStrictEqual([]);
  });

  it('uses only characters the German layout types', () => {
    const untypeable = shortcuts.flatMap((entry) =>
      entry.shortcut.keys
        .flat()
        .filter((key) => isCharacter(key) && !typedCharacters.has(key))
        .map((key) => `${nameOf(entry)}: ${key}`),
    );

    expect(untypeable).toStrictEqual([]);
  });

  it('has one key besides the modifiers in every combination on German', () => {
    const invalid = shortcuts.flatMap((entry) =>
      entry.shortcut.keys
        .map((keys) => resolveKeys(keymap, keys))
        .filter((keys) => keys.filter((key) => !isModifier(key)).length !== 1)
        .map((keys) => `${nameOf(entry)}: ${describeKeys(keys)}`),
    );

    expect(invalid).toStrictEqual([]);
  });

  it('passes the practice policy in every combination on German, reserved keys aside', () => {
    // Reserved combinations are left out: the data may list them, practice only hides them.
    const policy = practicePolicy([]);
    const rejected = shortcuts.flatMap((entry) =>
      entry.shortcut.keys.flatMap((keys) => {
        const result = checkShortcut(policy, resolveKeys(keymap, keys));

        return result.kind === 'err'
          ? [`${nameOf(entry)}: ${describeKeys(keys)} is ${describeRejection(result.error)}`]
          : [];
      }),
    );

    expect(rejected).toStrictEqual([]);
  });

  it('captures the press of every combination as its keys on German', () => {
    // Key capture and key resolution have to name keys alike, or a correct answer fails.
    const mismatched = shortcuts.flatMap((entry) =>
      entry.shortcut.keys
        .map((keys) => resolveKeys(keymap, keys))
        .filter((keys) => {
          const captured = combinationOf(keymap, pressFor(keys));

          return captured === undefined || !isSameCombination(captured, keys);
        })
        .map((keys) => `${nameOf(entry)}: ${describeKeys(keys)}`),
    );

    expect(mismatched).toStrictEqual([]);
  });

  it('has every message key in the German catalog', () => {
    const missing = apps.flatMap((app) => {
      const catalogKeys = new Set(catalogKeysOf(app));

      return messageKeysOf(app)
        .filter((key) => !catalogKeys.has(key))
        .map((key) => `${app.id}: ${key}`);
    });

    expect(missing).toStrictEqual([]);
  });

  it('uses every entry of the German catalog', () => {
    const unused = apps.flatMap((app) => {
      const messageKeys = new Set(messageKeysOf(app));

      return catalogKeysOf(app)
        .filter((key) => !messageKeys.has(key))
        .map((key) => `${app.id}: ${key}`);
    });

    expect(unused).toStrictEqual([]);
  });
});
