import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { effectScope } from 'vue';

import germanKeymap from '@/domain/keyboard/germanKeymap.fixture.json';
import { practicePolicy } from '@/domain/keyboard/policy';
import type { SummaryContext } from '@/domain/progress/summary';
import { localDay } from '@/domain/scheduling/days';
import { err, ok } from '@/domain/shared/result';
import type { AppDefinition } from '@/domain/shortcuts/types';
import type { MenuChoice } from '@/domain/usage/menuChoice';
import type { UsageRepository } from '@/domain/usage/repository';
import { localTimeAt } from '@/localTime';
import type { Coach } from '@/ports';

import { useMenuCoach } from './useMenuCoach';

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
      shortcuts: [{ title: 'essentials.newNote', keys: [['Meta', 'n']] }],
    },
  ],
};

const context: SummaryContext = {
  keymap: germanKeymap,
  policy: practicePolicy([]),
  layout: german,
  progress: { sets: [], cards: [] },
  endOfToday: 0,
};

/** The coach in a main window whose context is `loaded`, with the menu choices the test makes. */
function coach(
  loaded: SummaryContext | undefined,
  repository: Partial<UsageRepository> = {},
  showsBanner = true,
) {
  const stopFollowing = vi.fn();
  const onMenuChosen = vi.fn<Coach['onMenuChosen']>(() => stopFollowing);
  const showBanner = vi.fn<Coach['showBanner']>(() => Promise.resolve(ok(undefined)));
  const usage: UsageRepository = {
    recordMenuUse: vi.fn(() => Promise.resolve(ok(undefined))),
    ...repository,
  };
  const logger = { warn: vi.fn(), error: vi.fn() };
  const scope = effectScope();
  onTestFinished(() => {
    scope.stop();
  });
  scope.run(() => {
    useMenuCoach(
      [notes],
      { coach: { onMenuChosen, showBanner }, usage, logger },
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
    usage,
    showBanner,
    logger,
    stopFollowing,
    stop: () => {
      scope.stop();
    },
  };
}

describe('useMenuCoach', () => {
  it('counts a menu choice of a known shortcut on the layout and the local day of now', () => {
    const { choose, usage } = coach(context);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    expect(usage.recordMenuUse).toHaveBeenCalledWith({
      id: 'notes/Meta+n',
      layout: german,
      day: localDay(localTimeAt(now)),
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
    expect(usage.recordMenuUse).toHaveBeenCalledOnce();
  });

  it('ignores a choice Mouseless has no shortcut for', () => {
    const { choose, usage, showBanner } = coach(context);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'p'] });

    expect(usage.recordMenuUse).not.toHaveBeenCalled();
    expect(showBanner).not.toHaveBeenCalled();
  });

  it('ignores choices until the window has loaded', () => {
    const { choose, usage } = coach(undefined);

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    expect(usage.recordMenuUse).not.toHaveBeenCalled();
  });

  it('logs a use that could not be counted', async () => {
    const { choose, logger } = coach(context, {
      recordMenuUse: () => Promise.resolve(err({ kind: 'database', message: 'locked' })),
    });

    choose({ bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] });

    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Could not count a menu use: locked');
    });
  });

  it('stops following menu choices with its component', () => {
    const { stop, stopFollowing } = coach(context);

    stop();

    expect(stopFollowing).toHaveBeenCalledOnce();
  });
});
