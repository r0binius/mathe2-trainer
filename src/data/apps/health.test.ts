import { describe, expect, it } from 'vitest';

import germanKeymap from '@/domain/keyboard/germanKeymap.fixture.json';
import type { Keymap } from '@/domain/keyboard/keymap';
import { keyCodes } from '@/domain/keyboard/keymap';
import { macosKeyLabels } from '@/domain/keyboard/labels';
import type { Rejection } from '@/domain/keyboard/policy';
import { checkShortcut, practicePolicy } from '@/domain/keyboard/policy';
import type { KeyCombination } from '@/domain/keyboard/resolve';
import { isModifier, resolveKeys } from '@/domain/keyboard/resolve';
import { shortcutId } from '@/domain/shortcuts/shortcutId';
import type { AppDefinition, ShortcutDefinition, ShortcutSet } from '@/domain/shortcuts/types';

// Rules that types can't express, checked over the data of every app. Each rule lists all its
// violations, so a failure shows every problem at once.

const keymap: Keymap = germanKeymap;

const modules = import.meta.glob<Readonly<Record<string, AppDefinition>>>('./*/index.ts', {
  eager: true,
});
const catalogs = import.meta.glob<unknown>('./*/de.json', { eager: true, import: 'default' });

function folderOf(path: string): string {
  return path.split('/')[1] ?? path;
}

const apps = Object.entries(modules).flatMap(([path, module]) =>
  Object.values(module).map((app) => ({ folder: folderOf(path), app })),
);

type ShortcutEntry = {
  readonly app: AppDefinition;
  readonly set: ShortcutSet;
  readonly shortcut: ShortcutDefinition;
};

const shortcuts: readonly ShortcutEntry[] = apps.flatMap(({ app }) =>
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

function describeRejection(rejection: Rejection): string {
  switch (rejection.reason) {
    case 'duplicate-key':
      return `${rejection.reason} ${rejection.key}`;
    case 'modifier-only':
    case 'reserved':
      return rejection.reason;
  }
}

// Flattens a nested catalog into `a.b` keys, keeping only entries that are text.
function flattenCatalog(catalog: unknown, prefix = ''): readonly string[] {
  if (typeof catalog === 'string') {
    return [prefix];
  }

  return typeof catalog === 'object' && catalog !== null
    ? Object.entries(catalog).flatMap(([key, value]) =>
        flattenCatalog(value, prefix === '' ? key : `${prefix}.${key}`),
      )
    : [];
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

function catalogKeysOf(folder: string): readonly string[] {
  return flattenCatalog(catalogs[`./${folder}/de.json`]);
}

describe('app data', () => {
  it('finds one app in each folder', () => {
    expect(apps.map(({ app }) => app.id)).toHaveLength(Object.keys(modules).length);
    expect(apps.length).toBeGreaterThanOrEqual(10);
  });

  it('names each app folder after its app ID', () => {
    const mismatches = apps
      .filter(({ folder, app }) => folder !== app.id)
      .map(({ folder, app }) => `${folder}: ${app.id}`);

    expect(mismatches).toStrictEqual([]);
  });

  it('uses each set ID once per app', () => {
    const duplicates = apps.flatMap(({ app }) =>
      duplicatesIn(app.sets.map((set) => set.id)).map((id) => `${app.id}/${id}`),
    );

    expect(duplicates).toStrictEqual([]);
  });

  it('uses the same keys only once per set', () => {
    // Across sets, the same keys are allowed: they share one shortcut ID and its progress.
    const duplicates = apps.flatMap(({ app }) =>
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

  it('has every message key in the German catalog', () => {
    const missing = apps.flatMap(({ folder, app }) => {
      const catalogKeys = new Set(catalogKeysOf(folder));

      return messageKeysOf(app)
        .filter((key) => !catalogKeys.has(key))
        .map((key) => `${app.id}: ${key}`);
    });

    expect(missing).toStrictEqual([]);
  });

  it('uses every entry of the German catalog', () => {
    const unused = apps.flatMap(({ folder, app }) => {
      const messageKeys = new Set(messageKeysOf(app));

      return catalogKeysOf(folder)
        .filter((key) => !messageKeys.has(key))
        .map((key) => `${app.id}: ${key}`);
    });

    expect(unused).toStrictEqual([]);
  });
});
