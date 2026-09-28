import { describe, expect, it } from 'vitest';

import { validMemory } from '../scheduling/memory.fixture';
import type { Card } from '../scheduling/scheduler';
import type { AppDefinition } from '../shortcuts/types';
import type { SetRecord } from './reconcile';
import { reconcileProgress } from './reconcile';

const apps: readonly AppDefinition[] = [
  {
    id: 'app',
    title: 'App',
    category: 'productivity',
    sets: [
      {
        id: 'basics',
        title: 'basics.title',
        shortcuts: [{ title: 'basics.find', keys: [['Meta', 'f']] }],
      },
      {
        id: 'more',
        title: 'more.title',
        shortcuts: [{ title: 'more.save', keys: [['Meta', 's']] }],
      },
    ],
  },
];

const memory = validMemory({
  stability: 2,
  difficulty: 5,
  lastReviewAt: 0,
  dueAt: 1000,
  reps: 1,
  lapses: 0,
});

function card(id: Card['id']): Card {
  return { ...memory, id };
}

function record(setId: string, learned: SetRecord['progress']['learned']): SetRecord {
  return { appId: 'app', setId, progress: { learned, completedAt: 5, updatedAt: 10 } };
}

describe('reconcileProgress', () => {
  it('keeps progress that still matches the data as it is', () => {
    const progress = { sets: [record('basics', ['app/Meta+f'])], cards: [card('app/Meta+f')] };
    const reconciled = reconcileProgress(progress, apps);

    expect(reconciled.sets[0]).toBe(progress.sets[0]);
    expect(reconciled.cards[0]).toBe(progress.cards[0]);
  });

  it('drops the progress of sets and apps that no longer exist', () => {
    const gone = [record('removed', []), { ...record('basics', []), appId: 'removedApp' }];

    expect(reconcileProgress({ sets: gone, cards: [] }, apps).sets).toStrictEqual([]);
  });

  it('drops learned shortcuts that are no longer in their set, keeping the rest of the record', () => {
    const progress = {
      sets: [record('basics', ['app/Meta+f', 'app/Meta+g', 'app/Meta+s'])],
      cards: [],
    };

    // Meta+g was removed, and Meta+s belongs to another set.
    expect(reconcileProgress(progress, apps).sets).toStrictEqual([
      record('basics', ['app/Meta+f']),
    ]);
  });

  it('drops the cards of shortcuts that are no longer in any set', () => {
    const cards = [
      card('app/Meta+f'),
      card('app/Meta+g'),
      card('removedApp/Meta+f'),
      card('app/Meta+s'),
    ];

    expect(reconcileProgress({ sets: [], cards }, apps).cards).toStrictEqual([
      card('app/Meta+f'),
      card('app/Meta+s'),
    ]);
  });

  it('keeps the fields a caller adds to its records, such as the keyboard layout', () => {
    const withLayout = {
      ...record('basics', ['app/Meta+g']),
      layout: 'com.apple.keylayout.German',
    };

    expect(reconcileProgress({ sets: [withLayout], cards: [] }, apps).sets[0]).toMatchObject({
      layout: 'com.apple.keylayout.German',
      progress: { learned: [] },
    });
  });
});
