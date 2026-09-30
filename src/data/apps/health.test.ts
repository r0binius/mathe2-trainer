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
import { checkShortcut, practicableKeys, practicePolicy } from '@/domain/keyboard/policy';
import { keyOf, resolveKeys } from '@/domain/keyboard/resolve';
import usKeymap from '@/domain/keyboard/usKeymap.fixture.json';
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

// The key of a combination besides its modifiers.
function mainKeyOf(keys: KeyCombination): string {
  return keys.find((candidate) => !isModifier(candidate)) ?? '';
}

// The physical key a layout types a key with, or the key's name for keys named by their code.
function codeFor(layout: Keymap, key: string): string | undefined {
  return (
    keyCodes.find((code) => keyOf(layout, code) === key) ?? (namedKeys.has(key) ? key : undefined)
  );
}

// The press that types resolved keys on a layout: the key's physical key, with its modifiers.
function pressFor(layout: Keymap, keys: KeyCombination): KeyPress {
  return {
    code: codeFor(layout, mainKeyOf(keys)) ?? '',
    control: keys.includes('Control'),
    alt: keys.includes('Alt'),
    shift: keys.includes('Shift'),
    meta: keys.includes('Meta'),
  };
}

function isSameList(first: readonly string[], second: readonly string[]): boolean {
  return first.toSorted().join('\n') === second.toSorted().join('\n');
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

// The entries of the German catalog, apart from the app's translated name, which isn't a key.
function catalogKeysOf(app: AppDefinition): readonly string[] {
  return flattenCatalog(app.catalogs.de).filter((key) => key !== 'appTitle');
}

describe('app data', () => {
  it('lists every app folder in `apps.ts`, each under its app ID', () => {
    // The screens find an app's logo by its folder, so the two have to match.
    expect(apps.map((app) => app.id).toSorted()).toStrictEqual(folders.toSorted());
  });

  it('has a logo in every app folder', () => {
    const logos = Object.keys(import.meta.glob('./*/logo.svg')).map((path) => path.split('/')[1]);

    expect(logos).toStrictEqual(folders);
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

  it.each([
    ['German', keymap],
    ['US', usKeymap],
  ])('can practice every shortcut on %s, reserved keys aside', (_, layout) => {
    // An alternative may be written for another layout, where it's rejected: a character that
    // needs Shift on US, say. Every shortcut needs one combination the practice policy allows.
    // Reserved combinations are left out: the data may list them, practice only hides them.
    const policy = practicePolicy([]);
    const impossible = shortcuts
      .filter((entry) => practicableKeys(layout, entry.shortcut.keys, policy) === undefined)
      .map((entry) => {
        const rejections = entry.shortcut.keys.map((keys) => {
          const resolved = resolveKeys(layout, keys);
          const result = checkShortcut(policy, resolved);

          return result.kind === 'err'
            ? `${describeKeys(resolved)} is ${describeRejection(result.error)}`
            : describeKeys(resolved);
        });

        return `${nameOf(entry)}: ${rejections.join(', ')}`;
      });

    expect(impossible).toStrictEqual([]);
  });

  it.each([
    ['German', keymap],
    ['US', usKeymap],
  ])('captures the press of every combination as its keys on %s', (_, layout) => {
    // Key capture and key resolution have to name keys alike, or a correct answer fails. Only what
    // practice offers counts: a key the layout can't type (an umlaut on US) can't be pressed.
    const mismatched = shortcuts.flatMap((entry) =>
      entry.shortcut.keys
        .map((keys) => resolveKeys(layout, keys))
        .filter((keys) => codeFor(layout, mainKeyOf(keys)) !== undefined)
        // What the policy rejects, practice never offers, such as Shift twice on US for Shift + `+`.
        .filter((keys) => checkShortcut(practicePolicy([]), keys).kind === 'ok')
        .filter((keys) => {
          const captured = combinationOf(layout, pressFor(layout, keys));

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

  it('has the same entries in English as in German', () => {
    const differing = apps.flatMap(({ id, catalogs: { de, en } }) =>
      isSameList(flattenCatalog(en), flattenCatalog(de)) ? [] : [id],
    );

    expect(differing).toStrictEqual([]);
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
