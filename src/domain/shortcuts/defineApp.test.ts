import { describe, expect, it } from 'vitest';

import { defineApp } from './defineApp';

describe('defineApp', () => {
  it('returns the definition unchanged', () => {
    const definition = {
      id: 'bitwig',
      title: 'Bitwig Studio',
      category: 'music',
      sets: [
        {
          id: 'transport',
          title: 'transport.title',
          shortcuts: [
            { title: 'transport.play', keys: [['Space'], ['p']] },
            { title: 'transport.record', description: 'transport.recordHint', keys: [['r']] },
          ],
        },
      ],
    } as const;

    expect(defineApp(definition)).toBe(definition);
  });

  describe('types', () => {
    it('rejects keys written as one combination instead of a list of them', () => {
      defineApp({
        id: 'app',
        title: 'App',
        category: 'system',
        sets: [
          {
            id: 'set',
            title: 'set.title',
            // @ts-expect-error -- keys must be a list of combinations, such as [['Meta', 'f']].
            shortcuts: [{ title: 'set.find', keys: ['Meta', 'f'] }],
          },
        ],
      });
    });

    it('rejects a shortcut without keys', () => {
      defineApp({
        id: 'app',
        title: 'App',
        category: 'system',
        // @ts-expect-error -- keys needs at least one combination.
        sets: [{ id: 'set', title: 'set.title', shortcuts: [{ title: 'set.find', keys: [] }] }],
      });
    });

    it('rejects an unknown category', () => {
      defineApp({
        id: 'app',
        title: 'App',
        // @ts-expect-error -- a typo would otherwise create a new category.
        category: 'sytem',
        sets: [],
      });
    });
  });
});
