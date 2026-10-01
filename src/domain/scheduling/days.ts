import type { ReviewTime } from './scheduler';
import { dayMs } from './scheduler';

/**
 * When the local day of a moment ends, as epoch milliseconds: the boundary {@link dueCards} counts
 * due cards up to. The shell passes the UTC offset at that moment.
 */
export function endOfLocalDay(time: ReviewTime): number {
  return startOfLocalDay(localDay(time) + 1, time);
}

/**
 * The local day of a moment as a number, counted with the UTC offset at that moment: two moments
 * on the same local date get the same number, and the next date the next one.
 */
export function localDay({ at, utcOffsetMinutes }: ReviewTime): number {
  return Math.floor((at + offsetMs(utcOffsetMinutes)) / dayMs);
}

/** When a local day starts, as epoch milliseconds, in the UTC offset of `time`. */
export function startOfLocalDay(day: number, { utcOffsetMinutes }: ReviewTime): number {
  return day * dayMs - offsetMs(utcOffsetMinutes);
}

/** In how many local days a time is: 0 later today, 1 any time tomorrow, and so on. */
export function daysUntil(time: number, endOfToday: number): number {
  return time < endOfToday ? 0 : Math.floor((time - endOfToday) / dayMs) + 1;
}

function offsetMs(utcOffsetMinutes: number): number {
  return utcOffsetMinutes * 60 * 1000;
}
