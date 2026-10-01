import { describe, expect, it } from 'vitest';

import { dayMs } from '../scheduling/scheduler';
import type { AppDefinition } from '../shortcuts/types';
import { activityDays, logStart, summarizeOverview } from './overview';
import type { ReviewLogEntry } from './reviewLog';
import type { AppSummary } from './summary';

const hourMs = 60 * 60 * 1000;

/** 12:00 in Berlin summer time (UTC+2) on 1 October 2026. */
const now = { at: Date.UTC(2026, 9, 1, 10), utcOffsetMinutes: 120 };

function app(id: string): AppDefinition {
  return {
    id,
    title: id,
    bundleIds: [],
    category: 'productivity',
    catalogs: { de: {}, en: {} },
    sets: [],
  };
}

type Counts = Pick<AppSummary, 'shortcuts' | 'learned' | 'due'>;

function summary(id: string, counts: Counts): AppSummary {
  return { app: app(id), ...counts };
}

/** A test `daysAgo` local days before today, at `hour` o'clock Berlin summer time. */
function tested(
  daysAgo: number,
  grade: ReviewLogEntry['grade'] = 'good',
  hour = 12,
): ReviewLogEntry {
  return { at: now.at - daysAgo * dayMs + (hour - 12) * hourMs, utcOffsetMinutes: 120, grade };
}

describe('summarizeOverview', () => {
  it('adds up what is due today, and lists the apps with reviews due, most due first', () => {
    const apps = [
      summary('a', { shortcuts: 10, learned: 4, due: 2 }),
      summary('b', { shortcuts: 5, learned: 0, due: 0 }),
      summary('c', { shortcuts: 8, learned: 8, due: 5 }),
    ];

    const overview = summarizeOverview(apps, [], now);

    expect(overview.due).toBe(7);
    expect(overview.dueApps.map(({ app: { id } }) => id)).toStrictEqual(['c', 'a']);
  });

  it('counts the tests done today, from local midnight on', () => {
    const log = [tested(1, 'good', 23), tested(0, 'good', 0), tested(0, 'again', 11)];

    expect(summarizeOverview([], log, now).reviewedToday).toBe(2);
  });

  it('adds up what is learned, and lists the apps with anything learned, best learned first', () => {
    const apps = [
      summary('a', { shortcuts: 10, learned: 4, due: 0 }),
      summary('b', { shortcuts: 5, learned: 0, due: 0 }),
      summary('c', { shortcuts: 8, learned: 6, due: 0 }),
    ];

    const overview = summarizeOverview(apps, [], now);

    expect(overview).toMatchObject({ learned: 10, shortcuts: 23 });
    expect(overview.learnedApps.map(({ app: { id } }) => id)).toStrictEqual(['c', 'a']);
  });

  it('gives the share of tests without a mistake over the last 30 days', () => {
    const log = [
      tested(30, 'again'),
      tested(29, 'again'),
      tested(3, 'hard'),
      tested(0, 'easy'),
      tested(0, 'good'),
    ];

    expect(summarizeOverview([], log, now).recallRate).toBe(0.75);
  });

  it('has no recall rate without tests in the last 30 days', () => {
    expect(summarizeOverview([], [tested(30)], now)).not.toHaveProperty('recallRate');
  });

  it('counts the days in a row with tests, up to today', () => {
    const log = [tested(5), tested(3), tested(2), tested(1), tested(1), tested(0)];

    expect(summarizeOverview([], log, now).daysInARow).toBe(4);
  });

  it('keeps the days in a row until today ends without a test', () => {
    expect(summarizeOverview([], [tested(2), tested(1)], now).daysInARow).toBe(2);
    expect(summarizeOverview([], [tested(3), tested(2)], now).daysInARow).toBe(0);
  });

  it('counts the tests per day over the last four weeks, oldest first', () => {
    const log = [tested(activityDays), tested(activityDays - 1), tested(2), tested(2), tested(0)];

    const { activity } = summarizeOverview([], log, now);

    expect(activity).toHaveLength(activityDays);
    expect(activity[0]).toBe(1);
    expect(activity.slice(-3)).toStrictEqual([2, 0, 1]);
    expect(activity.reduce((sum, tests) => sum + tests, 0)).toBe(4);
  });
});

describe('logStart', () => {
  it('starts the log at the local midnight 365 days back, today included', () => {
    // Midnight in Berlin summer time is 22:00 UTC the day before.
    expect(logStart(now)).toBe(Date.UTC(2025, 9, 1, 22));
  });
});
