import type { Item, ItemId } from '../content/types';
import type { LearnSnapshot } from '../practice/snapshot';
import { daysUntil, localDay } from '../scheduling/days';
import type { ReviewTime } from '../scheduling/scheduler';
import { dueCards } from '../scheduling/scheduler';
import type { LogEntry, Progress } from './progress';

/** How much of some items is learned. */
export type Tally = {
  readonly total: number;
  /** Recalled often enough to count as learned. */
  readonly learned: number;
  /** Seen or tested, but not learned yet. */
  readonly trained: number;
};

/** Counts how far the given items got. */
export function tallyOf(items: readonly Item[], { stages }: Progress): Tally {
  return {
    total: items.length,
    learned: items.filter(({ id }) => stages[id] === 'learned').length,
    trained: items.filter(({ id }) => stages[id] === 'trained').length,
  };
}

/** What a learning session starts from: how far the given items got in earlier ones. */
export function learningOf(
  items: readonly Item[],
  { stages }: Progress,
): Pick<LearnSnapshot, 'learned' | 'trained'> {
  const ids = items.map(({ id }) => id);

  return {
    learned: ids.filter((id) => stages[id] === 'learned'),
    trained: ids.filter((id) => stages[id] === 'trained'),
  };
}

/** The given items that are due for review today, the longest overdue first. */
export function dueItems(
  items: readonly Item[],
  { cards }: Progress,
  endOfToday: number,
): readonly Item[] {
  return dueCards(cards, endOfToday).flatMap((card) => items.filter(({ id }) => id === card.id));
}

/** In how many days an item is reviewed next, or `undefined` if it has no review card yet. */
export function nextReviewIn(
  id: ItemId,
  { cards }: Progress,
  endOfToday: number,
): number | undefined {
  const card = cards.find((candidate) => candidate.id === id);

  return card && daysUntil(card.dueAt, endOfToday);
}

/** How many tests were taken on each of the last `days` local days, oldest first, today last. */
export function activityOf(
  log: readonly LogEntry[],
  now: ReviewTime,
  days: number,
): readonly number[] {
  const today = localDay(now);
  const testDays = log.map(({ at }) => localDay({ ...now, at }));

  return Array.from({ length: days }, (_, index) => {
    const day = today - (days - 1 - index);

    return testDays.filter((testDay) => testDay === day).length;
  });
}

/**
 * How many days in a row were practiced, up to today. A day without practice ends the streak, but
 * today doesn't yet: it still counts from yesterday until the day is over.
 */
export function streakOf(log: readonly LogEntry[], now: ReviewTime): number {
  const today = localDay(now);
  const practiced = new Set(log.map(({ at }) => localDay({ ...now, at })));

  return countBack(practiced, practiced.has(today) ? today : today - 1);
}

function countBack(practiced: ReadonlySet<number>, day: number): number {
  return practiced.has(day) ? 1 + countBack(practiced, day - 1) : 0;
}

/** An item that keeps going wrong, and how often it did among its recent tests. */
export type WeakSpot = {
  readonly item: Item;
  readonly misses: number;
  readonly tests: number;
};

/** How many of an item's most recent tests decide whether it's a weak spot. */
const recentTests = 5;

/**
 * The items that went wrong most often in their recent tests, the worst first. An item whose
 * last test was right after only one miss isn't listed: that miss is dealt with.
 */
export function weakSpots(
  items: readonly Item[],
  { log }: Progress,
  limit: number,
): readonly WeakSpot[] {
  return items
    .map((item) => {
      const tests = log.filter(({ id }) => id === item.id).slice(-recentTests);
      const misses = tests.filter(({ grade }) => grade === 'again').length;

      return { item, misses, tests: tests.length, lastMissed: tests.at(-1)?.grade === 'again' };
    })
    .filter(({ misses, lastMissed }) => misses >= 2 || lastMissed)
    .toSorted((a, b) => b.misses - a.misses)
    .slice(0, limit)
    .map(({ item, misses, tests }) => ({ item, misses, tests }));
}
