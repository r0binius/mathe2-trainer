import { onScopeDispose, watch } from 'vue';

import type { SummaryContext } from '@/domain/progress/summary';
import { localDay } from '@/domain/scheduling/days';
import type { ShortcutId } from '@/domain/shortcuts/shortcutId';
import type { AppDefinition, MessageKey } from '@/domain/shortcuts/types';
import type { MenuChoice, MenuMatch } from '@/domain/usage/menuChoice';
import { matchMenuChoice } from '@/domain/usage/menuChoice';
import type { ShortcutUse, UsageRepository } from '@/domain/usage/repository';
import type { WatchedShortcut } from '@/domain/usage/watched';
import { watchedShortcuts } from '@/domain/usage/watched';
import { localTimeAt } from '@/localTime';
import type { Coach, Logger } from '@/ports';

/**
 * The ports the coach uses: the menu choices, the banner and the watched key presses, where uses
 * are counted, and the log.
 */
export type CoachPorts = {
  readonly coach: Pick<Coach, 'onMenuChosen' | 'showBanner' | 'setWatched' | 'onKeyUsed'>;
  readonly usage: Pick<UsageRepository, 'recordUse'>;
  readonly logger: Logger;
};

/** What the coach reads when something arrives. */
export type CoachReads = {
  /** The loaded context, or `undefined` while the window is loading. */
  readonly context: () => SummaryContext | undefined;
  readonly now: () => number;
  /** Whether a choice shows its shortcut in the banner, as the settings say. */
  readonly showsBanner: () => boolean;
  /** A text of an app's shortcut data in the interface's language, for the banner's title. */
  readonly appText: (appId: string, key: MessageKey) => string;
};

/**
 * Coaches with how the user works, while the calling component lives:
 *
 * - Each menu choice the Rust side reports that matches a shortcut of Mouseless's data on the
 *   current layout shows its keys in the banner, if the settings ask for it, and counts one menu
 *   use for the local day. Others are ignored, as are choices while the window is loading.
 * - The learned shortcuts are watched: the Rust side gets them whenever the context changes, and
 *   each press it reports counts one use by keys.
 */
export function useCoach(
  apps: readonly AppDefinition[],
  { coach, usage, logger }: CoachPorts,
  { context, now, showsBanner, appText }: CoachReads,
): void {
  async function count(id: ShortcutId, by: ShortcutUse['by']): Promise<void> {
    const loaded = context();

    if (loaded === undefined) {
      return;
    }

    const counted = await usage.recordUse({
      id,
      layout: loaded.layout,
      day: localDay(localTimeAt(now())),
      by,
    });

    if (counted.kind === 'err') {
      logger.error(`Could not count a use: ${counted.error.message}`);
    }
  }

  async function showBanner({ app, item }: MenuMatch): Promise<void> {
    const shown = await coach.showBanner({ title: appText(app.id, item.title), keys: item.keys });

    if (shown.kind === 'err') {
      logger.error(`Could not show the banner: ${shown.error.message}`);
    }
  }

  function chosen(choice: MenuChoice): void {
    const loaded = context();
    const match = loaded && matchMenuChoice(apps, choice, loaded);

    if (match === undefined) {
      return;
    }

    if (showsBanner()) {
      void showBanner(match);
    }
    void count(match.item.id, 'menu');
  }

  async function watchShortcuts(shortcuts: readonly WatchedShortcut[]): Promise<void> {
    const watched = await coach.setWatched(shortcuts);

    if (watched.kind === 'err') {
      logger.error(`Could not watch the learned shortcuts: ${watched.error.message}`);
    }
  }

  watch(
    () => {
      const loaded = context();

      return loaded && watchedShortcuts(apps, loaded);
    },
    (shortcuts) => {
      if (shortcuts !== undefined) {
        void watchShortcuts(shortcuts);
      }
    },
    { immediate: true },
  );

  onScopeDispose(coach.onMenuChosen(chosen));
  onScopeDispose(
    coach.onKeyUsed((id) => {
      void count(id, 'keys');
    }),
  );
}
