import { describe, expect, it } from 'vitest';

import germanKeymap from '../keyboard/germanKeymap.fixture.json';
import { practicePolicy } from '../keyboard/policy';
import type { SummaryContext } from '../progress/summary';
import type { AppDefinition } from '../shortcuts/types';
import { watchedShortcuts } from './watched';

const german = 'com.apple.keylayout.German';

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
        { title: 'essentials.help', keys: [['Meta', '?']] },
        { title: 'essentials.find', keys: [['Meta', 'f']] },
      ],
    },
  ],
};

/** An app whose shortcuts work everywhere, with no bundle ID to tell it's in front. */
const system: AppDefinition = { ...notes, id: 'macos', bundleIds: [] };

function context(learned: readonly string[], layout = german): SummaryContext {
  const sets = [notes, system].map((app) => ({
    appId: app.id,
    setId: 'essentials',
    layout,
    progress: {
      learned: learned.map((key) => `${app.id}/${key}` as const),
      trained: [],
      updatedAt: 0,
    },
  }));

  return {
    keymap: germanKeymap,
    policy: practicePolicy([]),
    layout: german,
    progress: { sets, cards: [] },
    endOfToday: 0,
  };
}

describe('watchedShortcuts', () => {
  it("watches each app's learned shortcuts with their keys on the layout", () => {
    expect(watchedShortcuts([notes], context(['Meta+n', 'Meta+?']))).toStrictEqual([
      { id: 'notes/Meta+n', bundleIds: ['com.apple.Notes'], keys: ['Meta', 'n'] },
      { id: 'notes/Meta+?', bundleIds: ['com.apple.Notes'], keys: ['Shift', 'Meta', 'ß'] },
    ]);
  });

  it('leaves out shortcuts not learned yet', () => {
    expect(watchedShortcuts([notes], context([]))).toStrictEqual([]);
  });

  it('leaves out what was learned on another layout', () => {
    expect(watchedShortcuts([notes], context(['Meta+n'], 'com.apple.keylayout.US'))).toStrictEqual(
      [],
    );
  });

  it('leaves out apps without a bundle ID, whose presses no app in front tells apart', () => {
    expect(watchedShortcuts([system], context(['Meta+n']))).toStrictEqual([]);
  });
});
