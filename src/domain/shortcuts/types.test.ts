import { describe, it } from 'vitest';

import type { AppDefinition } from './types';

// These tests check types: `pnpm typecheck` fails if an expected error goes missing.
function typeChecked(app: AppDefinition): AppDefinition {
  return app;
}

describe('AppDefinition', () => {
  it('rejects keys written as one combination instead of a list of them', () => {
    typeChecked({
      id: 'app',
      title: 'App',
      category: 'system',
      catalogs: { de: {} },
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
    typeChecked({
      id: 'app',
      title: 'App',
      category: 'system',
      catalogs: { de: {} },
      // @ts-expect-error -- keys needs at least one combination.
      sets: [{ id: 'set', title: 'set.title', shortcuts: [{ title: 'set.find', keys: [] }] }],
    });
  });

  it('rejects an unknown category', () => {
    typeChecked({
      id: 'app',
      title: 'App',
      // @ts-expect-error -- a typo would otherwise create a new category.
      category: 'sytem',
      catalogs: { de: {} },
      sets: [],
    });
  });
});
