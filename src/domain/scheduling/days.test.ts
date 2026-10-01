import { describe, expect, it } from 'vitest';

import { daysUntil, endOfLocalDay, localDay } from './days';
import { dayMs } from './scheduler';

const hourMs = 60 * 60 * 1000;

describe('endOfLocalDay', () => {
  it('ends the day at local midnight', () => {
    // 10:00 in Berlin summer time (UTC+2) is 08:00 UTC; the day ends at 22:00 UTC.
    const at = Date.UTC(2026, 8, 28, 8);

    expect(endOfLocalDay({ at, utcOffsetMinutes: 120 })).toBe(Date.UTC(2026, 8, 28, 22));
  });

  it('counts a time shortly after midnight to the new local day', () => {
    // 00:30 in Berlin is still the previous day in UTC.
    const at = Date.UTC(2026, 8, 27, 22, 30);

    expect(endOfLocalDay({ at, utcOffsetMinutes: 120 })).toBe(Date.UTC(2026, 8, 28, 22));
  });

  it('works west of UTC', () => {
    // 20:00 in New York summer time (UTC-4) is 00:00 UTC the next day.
    const at = Date.UTC(2026, 8, 29, 0);

    expect(endOfLocalDay({ at, utcOffsetMinutes: -240 })).toBe(Date.UTC(2026, 8, 29, 4));
  });
});

describe('daysUntil', () => {
  const endOfToday = Date.UTC(2026, 8, 28, 22);

  it('counts a time later today as today', () => {
    expect(daysUntil(endOfToday - hourMs, endOfToday)).toBe(0);
  });

  it('counts any time tomorrow as one day away', () => {
    expect(daysUntil(endOfToday, endOfToday)).toBe(1);
    expect(daysUntil(endOfToday + dayMs - 1, endOfToday)).toBe(1);
  });

  it('counts whole local days from there on', () => {
    expect(daysUntil(endOfToday + 2 * dayMs + hourMs, endOfToday)).toBe(3);
  });
});

describe('localDay', () => {
  it('numbers a day by its local date', () => {
    // 00:30 in Berlin on the 28th is 22:30 UTC on the 27th, but counts to the 28th.
    const afterMidnight = { at: Date.UTC(2026, 8, 27, 22, 30), utcOffsetMinutes: 120 };
    const evening = { at: Date.UTC(2026, 8, 28, 21, 30), utcOffsetMinutes: 120 };

    expect(localDay(afterMidnight)).toBe(localDay(evening));
    expect(
      localDay(evening) - localDay({ at: Date.UTC(2026, 8, 27, 12), utcOffsetMinutes: 120 }),
    ).toBe(1);
  });

  it('counts each moment with its own offset', () => {
    // 23:30 on the 25th in winter time (UTC+1) and 00:30 on the 26th in summer time (UTC+2).
    const winter = { at: Date.UTC(2026, 2, 25, 22, 30), utcOffsetMinutes: 60 };
    const summer = { at: Date.UTC(2026, 2, 25, 22, 30), utcOffsetMinutes: 120 };

    expect(localDay(summer) - localDay(winter)).toBe(1);
  });
});
