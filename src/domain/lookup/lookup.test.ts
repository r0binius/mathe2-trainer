import { describe, expect, it } from 'vitest';

import type { PlatformError } from '../shared/platformError';
import { err, ok } from '../shared/result';
import type { AppDefinition } from '../shortcuts/types';
import type { PopoverOpened } from './appInFront';
import type { LookupMsg, LookupUpdate } from './lookup';
import { initialLookup, updateLookup } from './lookup';
import type { MenuGroup } from './menuShortcuts';

const notes: AppDefinition = {
  id: 'notes',
  title: 'Notes',
  bundleIds: ['com.apple.Notes'],
  category: 'productivity',
  catalogs: { de: {}, en: {} },
  sets: [],
};
const apps = [notes];

const finder = { name: 'Finder', bundleId: 'com.apple.finder' };
const file: MenuGroup = {
  title: 'Ablage',
  shortcuts: [{ title: 'Neues Fenster', keys: ['Meta', 'n'] }],
};
const failure: PlatformError = { kind: 'lookup', message: 'the app answered too late' };

function opened(popover: PopoverOpened): LookupMsg {
  return { type: 'opened', opened: popover };
}

/** Applies the messages in turn, and returns the last model and effects. */
function replay(...msgs: readonly LookupMsg[]): LookupUpdate {
  return msgs.reduce<LookupUpdate>((previous, msg) => updateLookup(apps, previous.model, msg), {
    model: initialLookup,
    effects: [],
  });
}

describe('updateLookup', () => {
  it('waits for the popover to open first', () => {
    expect(initialLookup.screen).toStrictEqual({ kind: 'waiting' });
  });

  it('shows the built-in sets of an app it knows, without reading menus or asking for access', () => {
    const { model, effects } = replay(
      opened({ app: { name: 'Notizen', bundleId: 'com.apple.Notes' }, menuAccess: 'denied' }),
    );

    expect(model.screen).toStrictEqual({ kind: 'builtIn', app: notes });
    expect(effects).toStrictEqual([]);
  });

  it('asks for access before reading the menus of another app', () => {
    const { model, effects } = replay(opened({ app: finder, menuAccess: 'denied' }));

    expect(model.screen).toStrictEqual({ kind: 'needsAccess', app: finder });
    expect(effects).toStrictEqual([]);
  });

  it('opens System Settings when access is asked for', () => {
    const { effects } = replay(opened({ app: finder, menuAccess: 'denied' }), {
      type: 'accessAsked',
    });

    expect(effects).toStrictEqual([{ type: 'askForAccess' }]);
  });

  it('reads the menus of another app once access is granted', () => {
    const { model, effects } = replay(opened({ app: finder, menuAccess: 'granted' }));

    expect(model.screen).toStrictEqual({ kind: 'loading', app: finder });
    expect(effects).toStrictEqual([{ type: 'readMenus', opening: 1 }]);
  });

  it('shows the menu shortcuts once read', () => {
    const { model } = replay(opened({ app: finder, menuAccess: 'granted' }), {
      type: 'menusRead',
      opening: 1,
      result: ok([file]),
    });

    expect(model.screen).toStrictEqual({ kind: 'loaded', app: finder, groups: [file] });
  });

  it('shows that the menus could not be read', () => {
    const { model } = replay(opened({ app: finder, menuAccess: 'granted' }), {
      type: 'menusRead',
      opening: 1,
      result: err(failure),
    });

    expect(model.screen).toStrictEqual({ kind: 'failed', app: finder });
  });

  it('drops menus read for an earlier opening', () => {
    const { model } = replay(
      opened({ app: finder, menuAccess: 'granted' }),
      opened({ app: finder, menuAccess: 'granted' }),
      { type: 'menusRead', opening: 1, result: ok([file]) },
    );

    expect(model.screen).toStrictEqual({ kind: 'loading', app: finder });
  });

  it('drops menus read for an opening that showed something else since', () => {
    const { model } = replay(
      opened({ app: finder, menuAccess: 'granted' }),
      opened({ menuAccess: 'granted' }),
      { type: 'menusRead', opening: 1, result: ok([file]) },
    );

    expect(model.screen).toStrictEqual({ kind: 'noApp' });
  });

  it('shows that no other app is in front', () => {
    expect(replay(opened({ menuAccess: 'granted' })).model.screen).toStrictEqual({ kind: 'noApp' });
  });

  it('keeps what was searched for until the popover opens again', () => {
    const searched = replay(opened({ app: finder, menuAccess: 'granted' }), {
      type: 'searched',
      query: 'fenster',
    });
    const reopened = updateLookup(
      apps,
      searched.model,
      opened({ app: finder, menuAccess: 'granted' }),
    );

    expect(searched.model.query).toBe('fenster');
    expect(reopened.model.query).toBe('');
  });
});
