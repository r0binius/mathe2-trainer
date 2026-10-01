import { describe, expect, it } from 'vitest';

import { findApp, findAppInFront, findSet } from './lookup';
import type { AppDefinition, ShortcutSet } from './types';

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

describe('findAppInFront', () => {
  it('finds the app in front by its bundle ID', () => {
    expect(findAppInFront(apps, { name: 'Notizen', bundleId: 'com.apple.Notes' })).toBe(notes);
  });

  it('finds nothing for an app it has no sets for', () => {
    expect(findAppInFront(apps, { name: 'Mail', bundleId: 'com.apple.mail' })).toBeUndefined();
  });

  it('finds nothing for an app without a bundle ID, even if the name matches', () => {
    expect(findAppInFront(apps, { name: 'Notes' })).toBeUndefined();
  });
});

describe('findSet', () => {
  it('finds a set together with its app', () => {
    expect(findSet(apps, 'notes', 'basics')).toStrictEqual({ app: notes, set: basics });
  });

  it('finds nothing when the app or the set is unknown', () => {
    expect(findSet(apps, 'mail', 'basics')).toBeUndefined();
    expect(findSet(apps, 'notes', 'formats')).toBeUndefined();
  });
});
