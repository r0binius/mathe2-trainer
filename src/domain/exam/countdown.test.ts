import { describe, expect, it } from 'vitest';

import { countdownTo, describeCountdown } from './countdown';

// 10:00 in Berlin summer time (UTC+2) on 9 October 2026.
const now = { at: Date.UTC(2026, 9, 9, 8), utcOffsetMinutes: 120 };
function exam(day: number): number {
  return Date.UTC(2026, 10, day, 7);
}

describe('countdownTo', () => {
  it('counts the local days to the exam', () => {
    expect(countdownTo([exam(16)], now)).toEqual({ from: 38, to: 38 });
  });

  it('gives a range when the group decides the day', () => {
    expect(countdownTo([exam(19), exam(20)], now)).toEqual({ from: 41, to: 42 });
  });

  it('counts the exam day itself as 0, even after the exam started', () => {
    const onTheDay = { at: Date.UTC(2026, 10, 16, 9), utcOffsetMinutes: 60 };

    expect(countdownTo([exam(16)], onTheDay)).toEqual({ from: 0, to: 0 });
  });

  it('ignores exam days that are over', () => {
    const between = { at: Date.UTC(2026, 10, 19, 12), utcOffsetMinutes: 60 };

    expect(countdownTo([exam(19), exam(20)], between)).toEqual({ from: 0, to: 1 });
    expect(countdownTo([exam(16)], between)).toBeUndefined();
  });
});

describe('describeCountdown', () => {
  it('words a single day, today, tomorrow and a range', () => {
    expect(describeCountdown({ from: 38, to: 38 })).toBe('38 Tage');
    expect(describeCountdown({ from: 1, to: 1 })).toBe('1 Tag');
    expect(describeCountdown({ from: 0, to: 0 })).toBe('Heute');
    expect(describeCountdown({ from: 41, to: 42 })).toBe('41 – 42 Tage');
  });
});
