import { onScopeDispose } from 'vue';

import type { SummaryContext } from '@/domain/progress/summary';
import { localDay } from '@/domain/scheduling/days';
import type { AppDefinition, MessageKey } from '@/domain/shortcuts/types';
import type { MenuChoice, MenuMatch } from '@/domain/usage/menuChoice';
import { matchMenuChoice } from '@/domain/usage/menuChoice';
import type { UsageRepository } from '@/domain/usage/repository';
import { localTimeAt } from '@/localTime';
import type { Coach, Logger } from '@/ports';

/**
 * The ports coaching with menu choices uses: the choices and the banner, where they're counted,
 * and the log.
 */
export type MenuCoachPorts = {
  readonly coach: Pick<Coach, 'onMenuChosen' | 'showBanner'>;
  readonly usage: UsageRepository;
  readonly logger: Logger;
};

/** What counting menu choices reads when a choice arrives. */
export type MenuCoachReads = {
  /** The loaded context, or `undefined` while the window is loading. */
  readonly context: () => SummaryContext | undefined;
  readonly now: () => number;
  /** Whether a choice shows its shortcut in the banner, as the settings say. */
  readonly showsBanner: () => boolean;
  /** A text of an app's shortcut data in the interface's language, for the banner's title. */
  readonly appText: (appId: string, key: MessageKey) => string;
};

/**
 * Coaches with the menu choices the Rust side reports while the calling component lives: each one
 * that matches a shortcut of Mouseless's data on the current layout shows its keys in the banner,
 * if the settings ask for it, and counts one menu use for the local day. Others are ignored, as
 * are choices while the window is loading.
 */
export function useMenuCoach(
  apps: readonly AppDefinition[],
  { coach, usage, logger }: MenuCoachPorts,
  { context, now, showsBanner, appText }: MenuCoachReads,
): void {
  async function showBanner({ app, item }: MenuMatch): Promise<void> {
    const shown = await coach.showBanner({ title: appText(app.id, item.title), keys: item.keys });

    if (shown.kind === 'err') {
      logger.error(`Could not show the banner: ${shown.error.message}`);
    }
  }

  async function count(choice: MenuChoice): Promise<void> {
    const loaded = context();
    const match = loaded && matchMenuChoice(apps, choice, loaded);

    if (loaded === undefined || match === undefined) {
      return;
    }

    if (showsBanner()) {
      void showBanner(match);
    }

    const { item } = match;
    const counted = await usage.recordMenuUse({
      id: item.id,
      layout: loaded.layout,
      day: localDay(localTimeAt(now())),
    });

    if (counted.kind === 'err') {
      logger.error(`Could not count a menu use: ${counted.error.message}`);
    }
  }

  onScopeDispose(
    coach.onMenuChosen((choice) => {
      void count(choice);
    }),
  );
}
