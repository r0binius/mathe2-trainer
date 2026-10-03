import { describe, expect, it } from 'vitest';

import { findApp, findAppByBundleId, findSet, shortcutsById } from './lookup';
import type { AppDefinition, ShortcutDefinition, ShortcutSet } from './types';

const basics: ShortcutSet = { id: 'basics', title: 'basics.title', shortcuts: [] };

const notes: AppDefinition = {
  id: 'notes',
  title: 'Notes',
  bundleIds: ['com.apple.Notes'],
  category: 'productivity',
  catalogs: { de: {}, en: {} },
  sets: [basics],
};

const apps = [notes];

describe('findApp', () => {
  it('finds an app by its ID', () => {
    expect(findApp(apps, 'notes')).toBe(notes);
  });

  it('finds nothing for an unknown ID', () => {
    expect(findApp(apps, 'mail')).toBeUndefined();
  });
});

describe('findAppByBundleId', () => {
  it('finds an app by its bundle ID', () => {
    expect(findAppByBundleId(apps, 'com.apple.Notes')).toBe(notes);
  });

  it('finds nothing for an app it has no sets for', () => {
    expect(findAppByBundleId(apps, 'com.apple.mail')).toBeUndefined();
  });

  it('finds nothing for an app without a bundle ID', () => {
    expect(findAppByBundleId(apps, undefined)).toBeUndefined();
  });
});

describe('findSet', () => {
  it('finds a set together with its app', () => {
    expect(findSet(apps, { appId: 'notes', setId: 'basics' }, () => [])).toStrictEqual({
      app: notes,
      set: basics,
    });
  });

  it('finds a set made at runtime, with the app as the data defines it', () => {
    const yours = { id: 'your-commands', title: 'yourCommands.title', shortcuts: [] };

    expect(findSet(apps, { appId: 'notes', setId: 'your-commands' }, () => [yours])).toStrictEqual({
      app: notes,
      set: yours,
    });
  });

  it('finds nothing when the app or the set is unknown', () => {
    expect(findSet(apps, { appId: 'mail', setId: 'basics' }, () => [])).toBeUndefined();
    expect(findSet(apps, { appId: 'notes', setId: 'formats' }, () => [])).toBeUndefined();
  });
});

describe('shortcutsById', () => {
  it("finds each of an app's shortcuts by its ID, once though two sets share it", () => {
    const shared: ShortcutDefinition = { title: 'find', keys: [['Meta', 'f']] };
    const app: AppDefinition = {
      ...notes,
      sets: [
        { id: 'a', title: 'a.title', shortcuts: [shared] },
        { id: 'b', title: 'b.title', shortcuts: [shared] },
      ],
    };

    expect([...shortcutsById(app)]).toStrictEqual([['notes/Meta+f', shared]]);
  });
});
