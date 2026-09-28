import { describe, expect, it } from 'vitest';

import { findApp, findSet } from './lookup';
import type { AppDefinition, ShortcutSet } from './types';

const basics: ShortcutSet = { id: 'basics', title: 'basics.title', shortcuts: [] };

const notes: AppDefinition = {
  id: 'notes',
  title: 'Notes',
  category: 'productivity',
  catalogs: { de: {} },
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

describe('findSet', () => {
  it('finds a set together with its app', () => {
    expect(findSet(apps, 'notes', 'basics')).toStrictEqual({ app: notes, set: basics });
  });

  it('finds nothing when the app or the set is unknown', () => {
    expect(findSet(apps, 'mail', 'basics')).toBeUndefined();
    expect(findSet(apps, 'notes', 'formats')).toBeUndefined();
  });
});
