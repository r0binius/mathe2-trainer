import type { Decoder } from '../shared/decode';
import { array, integer, object } from '../shared/decode';
import type { ShortcutId } from '../shortcuts/shortcutId';
import { decodeShortcutId } from '../shortcuts/shortcutId';
import type { ShortcutUse } from './repository';

/** How many local days of counts the screens read, today included. */
export const usageDays = 30;

/** How often a shortcut was used on one local day, by its keys and from menus. */
export type UsageCount = {
  readonly id: ShortcutId;
  readonly day: number;
  readonly byKeys: number;
  readonly byMenu: number;
};

/** Decodes the counts, as Rust sends them. */
export const decodeUsageCounts: Decoder<readonly UsageCount[]> = array(
  object({ id: decodeShortcutId, day: integer, byKeys: integer, byMenu: integer }),
);

/** The first local day the screens read, {@link usageDays} back from `today`. */
export function usageSince(today: number): number {
  return today - usageDays + 1;
}

/** `counts` with one more use of a shortcut on a day, as the database counts it. */
export function withUse(
  counts: readonly UsageCount[],
  { id, day, by }: Pick<ShortcutUse, 'id' | 'day' | 'by'>,
): readonly UsageCount[] {
  const counted = counts.some((count) => count.id === id && count.day === day);

  return counted
    ? counts.map((count) => (count.id === id && count.day === day ? oneMore(count, by) : count))
    : [...counts, oneMore({ id, day, byKeys: 0, byMenu: 0 }, by)];
}

function oneMore(count: UsageCount, by: ShortcutUse['by']): UsageCount {
  return by === 'keys'
    ? { ...count, byKeys: count.byKeys + 1 }
    : { ...count, byMenu: count.byMenu + 1 };
}

/** How often each shortcut was chosen from a menu, over all the days of `counts`. */
export function menuTotals(counts: readonly UsageCount[]): ReadonlyMap<ShortcutId, number> {
  return counts
    .filter(({ byMenu }) => byMenu > 0)
    .reduce(
      (totals, { id, byMenu }) => new Map([...totals, [id, (totals.get(id) ?? 0) + byMenu]]),
      new Map<ShortcutId, number>(),
    );
}
