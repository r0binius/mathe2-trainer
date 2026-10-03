import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { effectScope } from 'vue';

import germanKeymap from '@/domain/keyboard/germanKeymap.fixture.json';
import { practicePolicy } from '@/domain/keyboard/policy';
import type { SummaryContext } from '@/domain/progress/summary';
import { localDay } from '@/domain/scheduling/days';
import { err, ok } from '@/domain/shared/result';
import type { ShortcutId } from '@/domain/shortcuts/shortcutId';
import type { AppDefinition } from '@/domain/shortcuts/types';
import type { MenuChoice } from '@/domain/usage/menuChoice';
import type { UsageRepository } from '@/domain/usage/repository';
import { localTimeAt } from '@/localTime';
import type { Coach } from '@/ports';

import { useCoach } from './useCoach';

const german = 'com.apple.keylayout.German';
const now = Date.UTC(2026, 9, 3, 10);

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
        { title: 'essentials.find', keys: [['Meta', 'f']] },
      ],
    },
  ],
};

/** The German layout, with ⌘N of Notes learned. */
const context: SummaryContext = {
  keymap: germanKeymap,
  policy: practicePolicy([]),
  layout: german,
  progress: {
    sets: [
      {
        appId: 'notes',
        setId: 'essentials',
        layout: german,
        progress: { learned: ['notes/Meta+n'], trained: [], updatedAt: 0 },
      },
    ],
    cards: [],
  },
  endOfToday: 0,
};

/** The coach in a main window whose context is `loaded`, with the choices and presses the test makes. */
function coach(
  loaded: SummaryContext | undefined,
  repository: Partial<UsageRepository> = {},
  showsBanner = true,
) {
  const stopFollowing = vi.fn();
  const onMenuChosen = vi.fn<Coach['onMenuChosen']>(() => stopFollowing);
  const onKeyUsed = vi.fn<Coach['onKeyUsed']>(() => stopFollowing);
  const showBanner = vi.fn<Coach['showBanner']>(() => Promise.resolve(ok(undefined)));
  const setWatched = vi.fn<Coach['setWatched']>(() => Promise.resolve(ok(undefined)));
  const usage: UsageRepository = {
    recordUse: vi.fn(() => Promise.resolve(ok(undefined))),
    ...repository,
  };
  const logger = { warn: vi.fn(), error: vi.fn() };
  const scope = effectScope();
  onTestFinished(() => {
    scope.stop();
  });
  scope.run(() => {
    useCoach(
      [notes],
      { coach: { onMenuChosen, showBanner, setWatched, onKeyUsed }, usage, logger },
      {
        context: () => loaded,
        now: () => now,
        showsBanner: () => showsBanner,
        appText: (appId, key) => `${appId}:${key}`,
      },
    );
  });

  return {
    choose: (choice: MenuChoice) => {
      onMenuChosen.mock.calls.forEach(([listener]) => {
        listener(choice);
      });
    },
    press: (id: ShortcutId) => {
      onKeyUsed.mock.calls.forEach(([listener]) => {
        listener(id);
      });
    },
    usage,
    showBanner,
    setWatched,
    logger,
    stopFollowing,
    stop: () => {
      scope.stop();
    },
  };
}

describe('useCoach', () => {
  it('counts a menu choice of a known shortcut on the layout and the local day of now', () => {
    const { choose, usage } = coach(context);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    expect(usage.recordUse).toHaveBeenCalledWith({
      id: 'notes/Meta+n',
      layout: german,
      day: localDay(localTimeAt(now)),
      by: 'menu',
    });
  });

  it("shows the shortcut's title in the interface's language and its keys in the banner", () => {
    const { choose, showBanner } = coach(context);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    expect(showBanner).toHaveBeenCalledWith({
      title: 'notes:essentials.newNote',
      keys: ['Meta', 'n'],
    });
  });

  it('shows no banner when the settings turn it off, and still counts', () => {
    const { choose, showBanner, usage } = coach(context, {}, false);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    expect(showBanner).not.toHaveBeenCalled();
    expect(usage.recordUse).toHaveBeenCalledOnce();
  });

  it('ignores a choice Mouseless has no shortcut for', () => {
    const { choose, usage, showBanner } = coach(context);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'p'] });

    expect(usage.recordUse).not.toHaveBeenCalled();
    expect(showBanner).not.toHaveBeenCalled();
  });

  it('ignores choices and presses until the window has loaded', () => {
    const { choose, press, usage, setWatched } = coach(undefined);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });
    press('notes/Meta+n');

    expect(usage.recordUse).not.toHaveBeenCalled();
    expect(setWatched).not.toHaveBeenCalled();
  });

  it('watches the learned shortcuts once the window has loaded', () => {
    const { setWatched } = coach(context);

    expect(setWatched).toHaveBeenCalledWith([
      { id: 'notes/Meta+n', bundleIds: ['com.apple.Notes'], keys: ['Meta', 'n'] },
    ]);
  });

  it('counts a press of a watched shortcut as a use by keys', () => {
    const { press, usage } = coach(context);

    press('notes/Meta+n');

    expect(usage.recordUse).toHaveBeenCalledWith({
      id: 'notes/Meta+n',
      layout: german,
      day: localDay(localTimeAt(now)),
      by: 'keys',
    });
  });

  it('logs a use that could not be counted', async () => {
    const { choose, logger } = coach(context, {
      recordUse: () => Promise.resolve(err({ kind: 'database', message: 'locked' })),
    });

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Could not count a use: locked');
    });
  });

  it('stops following menu choices and presses with its component', () => {
    const { stop, stopFollowing } = coach(context);

    stop();

    expect(stopFollowing).toHaveBeenCalledTimes(2);
  });
});
