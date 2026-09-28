import type { LayoutId } from '../keyboard/keymap';
import type { PracticeContext } from '../practice/items';
import { appPracticeItems, practiceItems, reviewItems } from '../practice/items';
import type { PracticeItem } from '../practice/session';
import type { Card } from '../scheduling/scheduler';
import { dueCards } from '../scheduling/scheduler';
import type { ShortcutId } from '../shortcuts/shortcutId';
import type { AppCategory, AppDefinition, ShortcutSet } from '../shortcuts/types';
import { appCategories } from '../shortcuts/types';
import type { StoredProgress } from './storedProgress';
import { setProgressOf } from './storedProgress';

/**
 * What a summary depends on: the layout and practice policy, the stored progress, and the local end
 * of today, which decides what's due.
 */
export type SummaryContext = PracticeContext & {
  readonly layout: LayoutId;
  readonly progress: StoredProgress;
  readonly endOfToday: number;
};

/** A set as the screens show it, on the current layout. */
export type SetSummary = {
  readonly set: ShortcutSet;
  /** Its shortcuts that can be practiced on this layout. */
  readonly items: readonly PracticeItem[];
  /** Which of those are learned. */
  readonly learned: readonly ShortcutId[];
  readonly completed: boolean;
  /** When the set was last practiced, if anything of it is learned. */
  readonly practicedAt?: number;
};

/** An app as the library shows it, on the current layout. */
export type AppSummary = {
  readonly app: AppDefinition;
  /** How many of its shortcuts can be practiced, each counted once. */
  readonly shortcuts: number;
  readonly learned: number;
  /** How many shortcuts a review would offer today. */
  readonly due: number;
  /** When the next card is due, if none is due today. */
  readonly nextDueAt?: number;
  /** When one of its sets was last practiced, if anything of it is learned. */
  readonly practicedAt?: number;
};

/** The apps of one category. */
export type CategoryGroup = {
  readonly category: AppCategory;
  readonly apps: readonly AppSummary[];
};

/**
 * Summarizes a set: what can be practiced on this layout, and how much of it is learned. Learned
 * shortcuts that can't be practiced here don't count, but stay stored.
 */
export function summarizeSet(appId: string, set: ShortcutSet, context: SummaryContext): SetSummary {
  const items = practiceItems(appId, set, context);
  const progress = setProgressOf(context.progress, {
    appId,
    setId: set.id,
    layout: context.layout,
  });
  const learned = (progress?.learned ?? []).filter((id) => items.some((item) => item.id === id));
  const summary = { set, items, learned, completed: progress?.completedAt !== undefined };

  return progress === undefined || learned.length === 0
    ? summary
    : { ...summary, practicedAt: progress.updatedAt };
}

/**
 * Summarizes an app across its sets. A shortcut in two sets counts once, and the due count is what a
 * review session of the app would offer.
 */
export function summarizeApp(app: AppDefinition, context: SummaryContext): AppSummary {
  const items = appPracticeItems(app, context);
  const sets = app.sets.map((set) => summarizeSet(app.id, set, context));
  const learned = new Set(sets.flatMap((set) => set.learned));
  const cards = context.progress.cards.filter((card) => items.some(({ id }) => id === card.id));
  const due = reviewItems(dueCards(cards, context.layout, context.endOfToday), items).length;
  const next = earliest(cards.filter((card) => isLater(card, context)).map(({ dueAt }) => dueAt));
  const practicedAt = latest(sets.flatMap((set) => set.practicedAt ?? []));

  return {
    app,
    shortcuts: items.length,
    learned: learned.size,
    due,
    ...(next === undefined ? {} : { nextDueAt: next }),
    ...(practicedAt === undefined ? {} : { practicedAt }),
  };
}

/** The summaries that were practiced, the most recently practiced first. */
export function recentFirst<T extends { readonly practicedAt?: number }>(
  summaries: readonly T[],
): readonly T[] {
  return summaries
    .filter((summary) => summary.practicedAt !== undefined)
    .toSorted((a, b) => (b.practicedAt ?? 0) - (a.practicedAt ?? 0));
}

/** The apps grouped by category, in the order of {@link appCategories}, without empty groups. */
export function groupByCategory(apps: readonly AppSummary[]): readonly CategoryGroup[] {
  return appCategories
    .map((category) => ({ category, apps: apps.filter(({ app }) => app.category === category) }))
    .filter((group) => group.apps.length > 0);
}

/** Whether a card of the current layout is due after today. */
function isLater(card: Card, { layout, endOfToday }: SummaryContext): boolean {
  return card.layout === layout && card.dueAt >= endOfToday;
}

function earliest(times: readonly number[]): number | undefined {
  return times.length === 0 ? undefined : Math.min(...times);
}

function latest(times: readonly number[]): number | undefined {
  return times.length === 0 ? undefined : Math.max(...times);
}
