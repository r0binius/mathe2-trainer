import type { ShortcutId } from '../shortcuts/shortcutId';
import { shortcutId } from '../shortcuts/shortcutId';
import type { AppDefinition, ShortcutDefinition } from '../shortcuts/types';
import type { UsageCount } from './usageCount';
import { menuTotals } from './usageCount';

/** How many of the commands still chosen from menus the overview lists. */
export const menuLeaders = 5;

/** A shortcut still chosen from menus: its app, its definition and how often. */
export type MenuLeader = {
  readonly app: AppDefinition;
  readonly shortcut: ShortcutDefinition;
  readonly byMenu: number;
};

/** How the user worked over the days of the counts, as the overview's By keyboard shows it. */
export type ByKeyboard = {
  /** The share of uses done with the keys, from 0 to 1, once anything was counted. */
  readonly share?: number;
  /** The shortcuts chosen from menus most, the most chosen first. */
  readonly fromMenus: readonly MenuLeader[];
};

/**
 * Sums up the counts: the share of uses done with the keys, and the {@link menuLeaders} shortcuts
 * of `apps` chosen from menus most. Counts of shortcuts no longer in the data are left out of the
 * list, but not of the share, which is history.
 * @see §5 of `docs/specs/science-backed-training.md`
 */
export function byKeyboard(
  apps: readonly AppDefinition[],
  counts: readonly UsageCount[],
): ByKeyboard {
  const byKeys = sum(counts.map((count) => count.byKeys));
  const total = byKeys + sum(counts.map((count) => count.byMenu));
  const fromMenus = [...menuTotals(counts)]
    .toSorted(([, a], [, b]) => b - a)
    .flatMap(([id, byMenu]) => leaderOf(apps, id, byMenu))
    .slice(0, menuLeaders);

  return total === 0 ? { fromMenus } : { share: byKeys / total, fromMenus };
}

/** The shortcut `id` names, with its app, or nothing if it's no longer in the data. */
function leaderOf(
  apps: readonly AppDefinition[],
  id: ShortcutId,
  byMenu: number,
): readonly MenuLeader[] {
  return apps.flatMap((app) =>
    app.sets
      .flatMap(({ shortcuts }) => shortcuts)
      .filter((shortcut) => shortcutId(app.id, shortcut.keys) === id)
      .slice(0, 1)
      .map((shortcut) => ({ app, shortcut, byMenu })),
  );
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
