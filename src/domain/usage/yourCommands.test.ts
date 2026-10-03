import { describe, expect, it } from 'vitest';

import type { AppDefinition, ShortcutDefinition } from '../shortcuts/types';
import { yourCommands, yourCommandsId, yourCommandsTitle } from './yourCommands';

const newNote: ShortcutDefinition = { title: 'essentials.newNote', keys: [['Meta', 'n']] };
const find: ShortcutDefinition = { title: 'essentials.find', keys: [['Meta', 'f']] };
const gallery: ShortcutDefinition = { title: 'view.asGallery', keys: [['Meta', '2']] };

const notes: AppDefinition = {
  id: 'notes',
  title: 'Notes',
  bundleIds: ['com.apple.Notes'],
  category: 'productivity',
  catalogs: { de: {}, en: {} },
  sets: [
    { id: 'essentials', title: 'essentials.title', shortcuts: [newNote, find] },
    { id: 'view', title: 'view.title', shortcuts: [gallery, newNote] },
  ],
};

function chosen(id: `${string}/${string}`, day: number, byMenu: number) {
  return { id, day, byKeys: 0, byMenu };
}

describe('yourCommands', () => {
  it("collects the app's shortcuts chosen from menus, most chosen first, each once", () => {
    const counts = [
      chosen('notes/Meta+n', 20_000, 1),
      chosen('notes/Meta+2', 20_000, 2),
      chosen('notes/Meta+n', 20_001, 3),
    ];

    expect(yourCommands(notes, counts)).toStrictEqual({
      id: yourCommandsId,
      title: yourCommandsTitle,
      shortcuts: [newNote, gallery],
    });
  });

  it('leaves out shortcuts only pressed by their keys, and other apps', () => {
    const counts = [
      { ...chosen('notes/Meta+f', 20_000, 0), byKeys: 4 },
      chosen('terminal/Meta+n', 20_000, 2),
    ];

    expect(yourCommands(notes, counts)).toBeUndefined();
  });

  it('leaves out shortcuts no longer in the data', () => {
    expect(yourCommands(notes, [chosen('notes/Meta+q', 20_000, 2)])).toBeUndefined();
  });
});
