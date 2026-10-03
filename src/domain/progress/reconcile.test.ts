import { describe, expect, it } from 'vitest';

import { validMemory } from '../scheduling/memory.fixture';
import type { Card } from '../scheduling/scheduler';
import type { AppDefinition } from '../shortcuts/types';
import { progressChanged, reconcileProgress } from './reconcile';
import type { SetRecord } from './storedProgress';

const apps: readonly AppDefinition[] = [
  {
    id: 'app',
    title: 'App',
    bundleIds: [],
    category: 'productivity',
    catalogs: { de: {}, en: {} },
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
  return { ...memory, id, layout: 'com.apple.keylayout.German' };
}

function record(setId: string, learned: SetRecord['progress']['learned']): SetRecord {
  return {
    appId: 'app',
    setId,
    layout: 'com.apple.keylayout.German',
    progress: { learned, trained: [], completedAt: 5, updatedAt: 10 },
  };
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

  it("keeps Your commands' progress, of any of the app's shortcuts still in the data", () => {
    const yours = record('your-commands', ['app/Meta+f', 'app/Meta+s', 'app/Meta+g']);
    const progress = { sets: [yours, { ...yours, appId: 'removedApp' }], cards: [] };

    expect(reconcileProgress(progress, apps).sets).toStrictEqual([
      { ...yours, progress: { ...yours.progress, learned: ['app/Meta+f', 'app/Meta+s'] } },
    ]);
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

  it('drops trained shortcuts that are no longer in their set, like learned ones', () => {
    const trained = {
      ...record('basics', []),
      progress: { ...record('basics', []).progress, trained: ['app/Meta+f', 'app/Meta+g'] },
    } as const;
    const [reconciled] = reconcileProgress({ sets: [trained], cards: [] }, apps).sets;

    expect(reconciled?.progress.trained).toStrictEqual(['app/Meta+f']);
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
});

describe('progressChanged', () => {
  const stored = { sets: [record('basics', [])], cards: [card('app/Meta+f')] };

  it('is false when reconciling kept every record and card', () => {
    expect(progressChanged(stored, reconcileProgress(stored, apps))).toBe(false);
  });

  it('is true when reconciling changed or removed a record, or removed a card', () => {
    const changedRecord = { ...stored, sets: [record('basics', ['app/Meta+x'])] };
    const removedCard = { ...stored, cards: [card('app/Meta+x')] };

    expect(progressChanged(changedRecord, reconcileProgress(changedRecord, apps))).toBe(true);
    expect(progressChanged(removedCard, reconcileProgress(removedCard, apps))).toBe(true);
  });
});
