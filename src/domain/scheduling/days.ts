import type { ReviewTime } from './scheduler';
import { dayMs } from './scheduler';

/**
 * When the local day of a moment ends, as epoch milliseconds: the boundary {@link dueCards} counts
 * due cards up to. The shell passes the UTC offset at that moment.
 */
export function endOfLocalDay({ at, utcOffsetMinutes }: ReviewTime): number {
  const offsetMs = utcOffsetMinutes * 60 * 1000;
  const localStartOfDay = Math.floor((at + offsetMs) / dayMs) * dayMs;

  return localStartOfDay + dayMs - offsetMs;
}

/** In how many local days a time is: 0 later today, 1 any time tomorrow, and so on. */
export function daysUntil(time: number, endOfToday: number): number {
  return time < endOfToday ? 0 : Math.floor((time - endOfToday) / dayMs) + 1;
}
