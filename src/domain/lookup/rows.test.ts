import { describe, expect, it } from 'vitest';

import germanKeymap from '../keyboard/germanKeymap.fixture.json';
import type { AppDefinition } from '../shortcuts/types';
import type { MenuGroup } from './menuShortcuts';
import { builtInGroups, menuGroups } from './rows';

describe('menuGroups', () => {
  it('resolves the keys of menu shortcuts on the layout', () => {
    const help: MenuGroup = {
      title: 'Hilfe',
      shortcuts: [{ title: 'Hilfe', keys: ['Meta', '?'] }],
    };

    expect(menuGroups([help], germanKeymap)).toStrictEqual([
      { title: 'Hilfe', items: [{ title: 'Hilfe', keys: ['Shift', 'Meta', 'ß'] }] },
    ]);
  });

  it('keeps reserved shortcuts, which the app really has', () => {
    const hide: MenuGroup = {
      title: 'Finder',
      shortcuts: [{ title: 'Andere', keys: ['Alt', 'Meta', 'h'] }],
    };

    expect(menuGroups([hide], germanKeymap)).toStrictEqual([
      { title: 'Finder', items: [{ title: 'Andere', keys: ['Alt', 'Meta', 'h'] }] },
    ]);
  });

  it('leaves out shortcuts that cannot be pressed, and menus left empty', () => {
    const impossible: MenuGroup = {
      title: 'Hilfe',
      shortcuts: [{ title: 'Hilfe', keys: ['Shift', 'Meta', '?'] }],
    };

    expect(menuGroups([impossible], germanKeymap)).toStrictEqual([]);
  });
});

describe('builtInGroups', () => {
  const notes: AppDefinition = {
    id: 'notes',
    title: 'Notes',
    bundleIds: ['com.apple.Notes'],
    category: 'productivity',
    catalogs: { de: {}, en: {} },
    sets: [
      {
        id: 'essentials',
        title: 'essentials.title',
        shortcuts: [
          { title: 'essentials.newNote', keys: [['Meta', 'n']] },
          { title: 'essentials.searchNotes', keys: [['Alt', 'Meta', 'f']] },
        ],
      },
      { id: 'empty', title: 'empty.title', shortcuts: [] },
    ],
  };

  it('shows each set as a group, translated, with keys resolved on the layout', () => {
    expect(builtInGroups(notes, germanKeymap, (key) => `«${key}»`)).toStrictEqual([
      {
        title: '«essentials.title»',
        items: [
          { title: '«essentials.newNote»', keys: ['Meta', 'n'] },
          { title: '«essentials.searchNotes»', keys: ['Alt', 'Meta', 'f'] },
        ],
      },
    ]);
  });
});
