import { describe, expect, it } from 'vitest';

import type { AppDefinition, ShortcutDefinition } from '../shortcuts/types';
import { byKeyboard, menuLeaders } from './byKeyboard';

const newNote: ShortcutDefinition = { title: 'essentials.newNote', keys: [['Meta', 'n']] };
const gallery: ShortcutDefinition = { title: 'view.asGallery', keys: [['Meta', '2']] };

const notes: AppDefinition = {
  id: 'notes',
  title: 'Notes',
  bundleIds: ['com.apple.Notes'],
  category: 'productivity',
  catalogs: { de: {}, en: {} },
  sets: [{ id: 'essentials', title: 'essentials.title', shortcuts: [newNote, gallery] }],
};

/** A day's count; which day doesn't matter to the sums. */
function used(id: `${string}/${string}`, byKeys: number, byMenu: number) {
  return { id, day: 20_000, byKeys, byMenu };
}

describe('byKeyboard', () => {
  it('shares the uses done with the keys out of all uses', () => {
    const counts = [used('notes/Meta+n', 3, 1), used('notes/Meta+2', 3, 1)];

    expect(byKeyboard([notes], counts).share).toBe(0.75);
  });

  it('has no share before anything was counted', () => {
    expect(byKeyboard([notes], []).share).toBeUndefined();
  });

  it('lists the shortcuts chosen from menus most, each with its app and how often', () => {
    const counts = [
      used('notes/Meta+n', 0, 1),
      used('notes/Meta+2', 0, 2),
      used('notes/Meta+n', 5, 0),
    ];

    expect(byKeyboard([notes], counts).fromMenus).toStrictEqual([
      { app: notes, shortcut: gallery, byMenu: 2 },
      { app: notes, shortcut: newNote, byMenu: 1 },
    ]);
  });

  it(`lists at most ${String(menuLeaders)}, and nothing only used with the keys`, () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
    const many: AppDefinition = {
      ...notes,
      sets: [
        {
          id: 'letters',
          title: 'letters.title',
          shortcuts: ids.map((key) => ({ title: key, keys: [['Meta', key]] })),
        },
      ],
    };
    const counts = ids.map((key, index) => used(`notes/Meta+${key}`, 1, index));

    const listed = byKeyboard([many], counts).fromMenus.map(({ shortcut }) => shortcut.title);

    expect(listed).toStrictEqual(['f', 'e', 'd', 'c', 'b']);
  });

  it('leaves out shortcuts no longer in the data', () => {
    expect(byKeyboard([notes], [used('notes/Meta+q', 0, 4)]).fromMenus).toStrictEqual([]);
  });
});
