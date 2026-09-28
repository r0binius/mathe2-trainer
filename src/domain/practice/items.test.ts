import { describe, expect, it } from 'vitest';

import germanKeymap from '../keyboard/germanKeymap.fixture.json';
import { macosReserved, practicePolicy } from '../keyboard/policy';
import { validMemory } from '../scheduling/memory.fixture';
import type { Card } from '../scheduling/scheduler';
import type { AppDefinition, ShortcutSet } from '../shortcuts/types';
import type { PracticeContext } from './items';
import { appPracticeItems, practiceItems, reviewItems } from './items';

const context: PracticeContext = { keymap: germanKeymap, policy: practicePolicy(macosReserved) };

const basics: ShortcutSet = {
  id: 'basics',
  title: 'basics.title',
  shortcuts: [
    { title: 'basics.help', description: 'basics.helpHint', keys: [['Meta', '?']] },
    { title: 'basics.spotlight', keys: [['Meta', 'Space']] },
    { title: 'basics.find', keys: [['Meta', 'f']] },
  ],
};

const more: ShortcutSet = {
  id: 'more',
  title: 'more.title',
  shortcuts: [
    { title: 'more.find', keys: [['Meta', 'f']] },
    { title: 'more.save', keys: [['Meta', 's']] },
  ],
};

const app: AppDefinition = {
  id: 'app',
  title: 'App',
  category: 'productivity',
  sets: [basics, more],
};

describe('practiceItems', () => {
  it('resolves each shortcut of a set for the layout, with its ID and texts', () => {
    expect(practiceItems(app.id, basics, context)).toStrictEqual([
      {
        id: 'app/Meta+?',
        keys: ['Shift', 'Meta', 'ß'],
        title: 'basics.help',
        description: 'basics.helpHint',
      },
      { id: 'app/Meta+f', keys: ['Meta', 'f'], title: 'basics.find' },
    ]);
  });

  it('leaves out shortcuts that no alternative lets you practice, such as reserved ones', () => {
    const ids = practiceItems(app.id, basics, context).map(({ id }) => id);

    expect(ids).not.toContain('app/Meta+Space');
  });
});

describe('appPracticeItems', () => {
  it('collects every set’s items, once per shortcut shared by several sets', () => {
    expect(appPracticeItems(app, context).map(({ id }) => id)).toStrictEqual([
      'app/Meta+?',
      'app/Meta+f',
      'app/Meta+s',
    ]);
  });
});

describe('reviewItems', () => {
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

  it('turns due cards into items in the cards’ order', () => {
    const items = practiceItems(app.id, more, context);

    expect(
      reviewItems([card('app/Meta+s'), card('app/Meta+f')], items).map(({ id }) => id),
    ).toStrictEqual(['app/Meta+s', 'app/Meta+f']);
  });

  it('leaves out cards without an item: other apps, removed or impossible shortcuts', () => {
    const items = appPracticeItems(app, context);

    expect(
      reviewItems(
        [card('other/Meta+f'), card('app/Meta+gone'), card('app/Meta+Space'), card('app/Meta+f')],
        items,
      ).map(({ id }) => id),
    ).toStrictEqual(['app/Meta+f']);
  });
});
