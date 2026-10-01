import { localDay, startOfLocalDay } from '../scheduling/days';
import type { ReviewTime } from '../scheduling/scheduler';
import type { ReviewLogEntry } from './reviewLog';
import type { AppSummary } from './summary';

/** How many local days of the review log the overview reads, today included. */
export const logDays = 365;

/** How many local days the recall rate looks back, today included. */
export const rateDays = 30;

/** How many local days the activity chart shows, today included. */
export const activityDays = 28;

/** Where learning stands on the current layout, as the overview shows it. */
export type Overview = {
  /** Shortcuts due for review today, over all apps. */
  readonly due: number;
  /** The apps with shortcuts due today, most due first. */
  readonly dueApps: readonly AppSummary[];
  /** Tests done today. */
  readonly reviewedToday: number;
  /** Learned shortcuts, over all apps. */
  readonly learned: number;
  /** Shortcuts that can be practiced, over all apps. */
  readonly shortcuts: number;
  /** The apps with anything learned, the best learned share first. */
  readonly learnedApps: readonly AppSummary[];
  /** The share of tests without a mistake over {@link rateDays}, if there were any. */
  readonly recallRate?: number;
  /** Days in a row with tests, up to today, or up to yesterday while today has none yet. */
  readonly daysInARow: number;
  /** Tests per local day over {@link activityDays}, oldest first, today last. */
  readonly activity: readonly number[];
};

/**
 * Summarizes the apps and the review log on the current layout as of `now`. The log is read with
 * the UTC offset of each entry, so days are the local dates the tests were done on.
 */
export function summarizeOverview(
  apps: readonly AppSummary[],
  log: readonly ReviewLogEntry[],
  now: ReviewTime,
): Overview {
  const today = localDay(now);
  const tests = log.map((entry) => ({ day: localDay(entry), recalled: entry.grade !== 'again' }));
  const days = tests.map(({ day }) => day);
  const recallRate = shareRecalled(tests.filter(({ day }) => day > today - rateDays));

  return {
    due: sum(apps.map(({ due }) => due)),
    dueApps: apps.filter(({ due }) => due > 0).toSorted((a, b) => b.due - a.due),
    reviewedToday: testsOn(days, today),
    learned: sum(apps.map(({ learned }) => learned)),
    shortcuts: sum(apps.map(({ shortcuts }) => shortcuts)),
    learnedApps: apps
      .filter(({ learned }) => learned > 0)
      .toSorted((a, b) => learnedShare(b) - learnedShare(a)),
    ...(recallRate === undefined ? {} : { recallRate }),
    daysInARow: daysInARow(new Set(days), today),
    activity: Array.from({ length: activityDays }, (_, index) =>
      testsOn(days, today - activityDays + 1 + index),
    ),
  };
}

/** When the review log the overview reads starts: local midnight {@link logDays} back. */
export function logStart(now: ReviewTime): number {
  return startOfLocalDay(localDay(now) - logDays + 1, now);
}

/** A logged test as the overview counts it: on which local day, and whether it had no mistake. */
type DayTest = { readonly day: number; readonly recalled: boolean };

function shareRecalled(tests: readonly DayTest[]): number | undefined {
  const recalled = tests.filter(({ recalled }) => recalled).length;

  return tests.length === 0 ? undefined : recalled / tests.length;
}

function daysInARow(days: ReadonlySet<number>, today: number): number {
  return runBack(days, days.has(today) ? today : today - 1);
}

/** How many days in a row, from `day` back, have tests. */
function runBack(days: ReadonlySet<number>, day: number): number {
  return days.has(day) ? 1 + runBack(days, day - 1) : 0;
}

function testsOn(days: readonly number[], day: number): number {
  return days.filter((tested) => tested === day).length;
}

function learnedShare({ learned, shortcuts }: AppSummary): number {
  return shortcuts === 0 ? 0 : learned / shortcuts;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
