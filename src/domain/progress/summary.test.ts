import { describe, expect, it } from 'vitest';

import germanKeymap from '../keyboard/germanKeymap.fixture.json';
import { macosReserved, practicePolicy } from '../keyboard/policy';
import { validMemory } from '../scheduling/memory.fixture';
import type { Card } from '../scheduling/scheduler';
import { dayMs } from '../scheduling/scheduler';
import type { AppDefinition, ShortcutSet } from '../shortcuts/types';
import type { SetRecord, StoredProgress } from './storedProgress';
import type { AppSummary, SummaryContext } from './summary';
import { groupByCategory, recentFirst, summarizeApp, summarizeSet } from './summary';

const german = 'com.apple.keylayout.German';
const us = 'com.apple.keylayout.US';
const endOfToday = Date.UTC(2026, 8, 28, 22);

const basics: ShortcutSet = {
  id: 'basics',
  title: 'basics.title',
  shortcuts: [
    { title: 'basics.find', keys: [['Meta', 'f']] },
    { title: 'basics.spotlight', keys: [['Meta', 'Space']] },
    { title: 'basics.save', keys: [['Meta', 's']] },
  ],
};

const more: ShortcutSet = {
  id: 'more',
  title: 'more.title',
  shortcuts: [
    { title: 'more.find', keys: [['Meta', 'f']] },
    { title: 'more.print', keys: [['Meta', 'p']] },
  ],
};

const app: AppDefinition = {
  id: 'app',
  title: 'App',
  category: 'productivity',
  catalogs: { de: {}, en: {} },
  sets: [basics, more],
};

function record(setId: string, learned: SetRecord['progress']['learned'], updatedAt: number) {
  return { appId: 'app', setId, layout: german, progress: { learned, trained: [], updatedAt } };
}

function card(id: Card['id'], dueAt: number, layout = german): Card {
  const memory = { stability: 2, difficulty: 5, lastReviewAt: 0, dueAt, reps: 1, lapses: 0 };

  return { ...validMemory(memory), id, layout };
}

function contextWith(progress: StoredProgress): SummaryContext {
  return {
    keymap: germanKeymap,
    policy: practicePolicy(macosReserved),
    layout: german,
    endOfToday,
    progress,
  };
}

const empty = contextWith({ sets: [], cards: [] });

describe('summarizeSet', () => {
  it('lists what can be practiced on the layout, with nothing learned yet', () => {
    const summary = summarizeSet(app.id, basics, empty);

    expect(summary.items.map(({ id }) => id)).toStrictEqual(['app/Meta+f', 'app/Meta+s']);
    expect(summary).toMatchObject({ learned: [], completed: false });
    expect(summary).not.toHaveProperty('practicedAt');
  });

  it('counts only learned shortcuts that can still be practiced here', () => {
    const progress = { sets: [record('basics', ['app/Meta+f', 'app/Meta+Space'], 5)], cards: [] };

    expect(summarizeSet(app.id, basics, contextWith(progress))).toMatchObject({
      learned: ['app/Meta+f'],
      practicedAt: 5,
    });
  });

  it('ignores the progress of the same set on another layout', () => {
    const progress = { sets: [{ ...record('basics', ['app/Meta+f'], 5), layout: us }], cards: [] };

    expect(summarizeSet(app.id, basics, contextWith(progress)).learned).toStrictEqual([]);
  });

  it('shows a completed set as completed, even while it is learned again', () => {
    const completed = {
      ...record('basics', [], 5),
      progress: { learned: [], trained: [], completedAt: 3, updatedAt: 5 },
    };

    expect(
      summarizeSet(app.id, basics, contextWith({ sets: [completed], cards: [] })),
    ).toMatchObject({
      completed: true,
    });
  });

  it('has no practice time when nothing of the set is learned', () => {
    const progress = { sets: [record('basics', [], 5)], cards: [] };

    expect(summarizeSet(app.id, basics, contextWith(progress))).not.toHaveProperty('practicedAt');
  });
});

describe('summarizeApp', () => {
  it('counts every shortcut of the app once, even when two sets share it', () => {
    expect(summarizeApp(app, empty)).toStrictEqual({ app, shortcuts: 3, learned: 0, due: 0 });
  });

  it('counts a shortcut learned in two sets once, and was practiced when its latest set was', () => {
    const progress = {
      sets: [record('basics', ['app/Meta+f', 'app/Meta+s'], 5), record('more', ['app/Meta+f'], 9)],
      cards: [],
    };

    expect(summarizeApp(app, contextWith(progress))).toMatchObject({ learned: 2, practicedAt: 9 });
  });

  it("counts the layout's due cards of the app that a review would offer", () => {
    const cards = [
      card('app/Meta+f', endOfToday - 1),
      card('app/Meta+Space', endOfToday - 1),
      card('app/Meta+s', endOfToday - 1, us),
      card('other/Meta+f', endOfToday - 1),
    ];

    expect(summarizeApp(app, contextWith({ sets: [], cards }))).toMatchObject({ due: 1 });
  });

  it('tells when the next card of the app is due once none is due today', () => {
    const cards = [
      card('app/Meta+f', endOfToday + 3 * dayMs),
      card('app/Meta+s', endOfToday + dayMs),
      card('other/Meta+f', endOfToday),
    ];

    expect(summarizeApp(app, contextWith({ sets: [], cards }))).toMatchObject({
      due: 0,
      nextDueAt: endOfToday + dayMs,
    });
  });
});

describe('recentFirst', () => {
  it('keeps what was practiced, the latest first', () => {
    const summaries = [{ id: 'a' }, { id: 'b', practicedAt: 1 }, { id: 'c', practicedAt: 7 }];

    expect(recentFirst(summaries)).toStrictEqual([summaries[2], summaries[1]]);
  });
});

describe('groupByCategory', () => {
  function summaryOf(id: string, category: AppDefinition['category']): AppSummary {
    return {
      app: { id, title: id, category, catalogs: { de: {}, en: {} }, sets: [] },
      shortcuts: 0,
      learned: 0,
      due: 0,
    };
  }

  it('groups apps by category in a fixed order, leaving out empty categories', () => {
    const notes = summaryOf('notes', 'productivity');
    const terminal = summaryOf('terminal', 'development');
    const bitwarden = summaryOf('bitwarden', 'productivity');

    expect(groupByCategory([notes, terminal, bitwarden])).toStrictEqual([
      { category: 'development', apps: [terminal] },
      { category: 'productivity', apps: [notes, bitwarden] },
    ]);
  });
});
