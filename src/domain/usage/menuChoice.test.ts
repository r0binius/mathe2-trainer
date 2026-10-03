import { describe, expect, it } from 'vitest';

import germanKeymap from '../keyboard/germanKeymap.fixture.json';
import { practicePolicy } from '../keyboard/policy';
import { err, ok } from '../shared/result';
import type { AppDefinition } from '../shortcuts/types';
import { decodeMenuChoice, matchMenuChoice } from './menuChoice';

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
      ],
    },
  ],
};

const context = { keymap: germanKeymap, policy: practicePolicy([]) };

describe('decodeMenuChoice', () => {
  it('decodes the app and keys, as Rust sends them', () => {
    const choice = { bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] };

    expect(decodeMenuChoice(choice)).toStrictEqual(ok(choice));
  });

  it('rejects a choice without keys', () => {
    expect(decodeMenuChoice({ bundleId: 'com.apple.Notes' })).toMatchObject(err({ path: 'keys' }));
  });
});

describe('matchMenuChoice', () => {
  it("finds the shortcut of the app's data with the chosen keys, and its app", () => {
    const choice = { bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] };
    const match = matchMenuChoice([notes], choice, context);

    expect(match?.app).toBe(notes);
    expect(match?.item.id).toBe('notes/Meta+n');
  });

  it('resolves the menu keys on the layout, as the popover does', () => {
    // On German, ? is Shift+ß, which is how the practice item names it.
    const choice = { bundleId: 'com.apple.Notes', keys: ['Meta', '?'] };

    expect(matchMenuChoice([notes], choice, context)?.item.keys).toStrictEqual([
      'Shift',
      'Meta',
      'ß',
    ]);
  });

  it('matches keys in any order', () => {
    const choice = { bundleId: 'com.apple.Notes', keys: ['n', 'Meta'] };

    expect(matchMenuChoice([notes], choice, context)?.item.id).toBe('notes/Meta+n');
  });

  it('matches nothing for a shortcut Mouseless has no data on', () => {
    const choice = { bundleId: 'com.apple.Notes', keys: ['Meta', 'p'] };

    expect(matchMenuChoice([notes], choice, context)).toBeUndefined();
  });

  it('matches nothing in an app Mouseless has no sets for', () => {
    const choice = { bundleId: 'com.apple.finder', keys: ['Meta', 'n'] };

    expect(matchMenuChoice([notes], choice, context)).toBeUndefined();
  });
});
