// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { Router } from 'vue-router';

import type { AppDefinition, ShortcutSet } from '@/domain/shortcuts/types';

import { createAppRouter } from './router';

const basics: ShortcutSet = { id: 'basics', title: 'basics.title', shortcuts: [] };

const notes: AppDefinition = {
  id: 'notes',
  title: 'Notes',
  category: 'productivity',
  catalogs: { de: {}, en: {} },
  sets: [basics],
};

/** The props the current route passes its screen. */
function propsOf(router: Router): unknown {
  const route = router.currentRoute.value;
  const props = route.matched[0]?.props['default'];

  return typeof props === 'function' ? props(route) : props;
}

async function open(path: string) {
  const router = createAppRouter([notes]);
  await router.push(path);

  return router;
}

describe('createAppRouter', () => {
  it('gives the library the apps', async () => {
    const router = await open('/');

    expect(router.currentRoute.value.name).toBe('library');
    expect(propsOf(router)).toStrictEqual({ apps: [notes] });
  });

  it('gives a screen the app and set its IDs name', async () => {
    expect(propsOf(await open('/apps/notes'))).toStrictEqual({ app: notes });
    expect(propsOf(await open('/apps/notes/review'))).toStrictEqual({ app: notes });
    expect(propsOf(await open('/apps/notes/sets/basics'))).toStrictEqual({
      app: notes,
      set: basics,
    });
    expect(propsOf(await open('/apps/notes/sets/basics/learn'))).toStrictEqual({
      app: notes,
      set: basics,
    });
  });

  it('goes to the library for an app or set that does not exist', async () => {
    expect((await open('/apps/mail')).currentRoute.value.name).toBe('library');
    expect((await open('/apps/notes/sets/formats')).currentRoute.value.name).toBe('library');
    expect((await open('/apps/mail/sets/basics/learn')).currentRoute.value.name).toBe('library');
  });

  it('goes to the library for a path it does not know', async () => {
    expect((await open('/nowhere/at/all')).currentRoute.value.name).toBe('library');
  });
});
