import { onScopeDispose } from 'vue';

import type { SummaryContext } from '@/domain/progress/summary';
import { localDay } from '@/domain/scheduling/days';
import type { AppDefinition } from '@/domain/shortcuts/types';
import type { MenuChoice } from '@/domain/usage/menuChoice';
import { matchMenuChoice } from '@/domain/usage/menuChoice';
import type { UsageRepository } from '@/domain/usage/repository';
import { localTimeAt } from '@/localTime';
import type { Coach, Logger } from '@/ports';

/** The ports counting menu choices uses: the choices, where they're counted, and the log. */
export type MenuCoachPorts = {
  readonly coach: Pick<Coach, 'onMenuChosen'>;
  readonly usage: UsageRepository;
  readonly logger: Logger;
};

/** What counting menu choices reads when a choice arrives. */
export type MenuCoachReads = {
  /** The loaded context, or `undefined` while the window is loading. */
  readonly context: () => SummaryContext | undefined;
  readonly now: () => number;
};

/**
 * Counts the menu choices the Rust side reports while the calling component lives: each one that
 * matches a shortcut of Mouseless's data on the current layout counts one menu use for the local
 * day. Others are ignored, as are choices while the window is loading.
 */
export function useMenuCoach(
  apps: readonly AppDefinition[],
  { coach, usage, logger }: MenuCoachPorts,
  { context, now }: MenuCoachReads,
): void {
  async function count(choice: MenuChoice): Promise<void> {
    const loaded = context();
    const item = loaded && matchMenuChoice(apps, choice, loaded);

    if (loaded === undefined || item === undefined) {
      return;
    }

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
