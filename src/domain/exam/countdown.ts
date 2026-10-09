import { daysUntil, endOfLocalDay, localDay, startOfLocalDay } from '../scheduling/days';
import type { ReviewTime } from '../scheduling/scheduler';

/** How many local days are left until the exam: a range while its day is not yet certain. */
export type Countdown = { readonly from: number; readonly to: number };

/**
 * The days left until the nearest and the furthest of the exam days that are not over yet, or
 * `undefined` when all of them are. An exam day counts as 0 for the whole day.
 */
export function countdownTo(exams: readonly number[], time: ReviewTime): Countdown | undefined {
  const startOfToday = startOfLocalDay(localDay(time), time);
  const endOfToday = endOfLocalDay(time);
  const days = exams.filter((at) => at >= startOfToday).map((at) => daysUntil(at, endOfToday));

  return days.length === 0 ? undefined : { from: Math.min(...days), to: Math.max(...days) };
}

/** The countdown in words: "Heute", "1 Tag", "38 Tage" or "41 – 42 Tage". */
export function describeCountdown({ from, to }: Countdown): string {
  if (from === to) {
    return from === 0 ? 'Heute' : `${String(from)} ${from === 1 ? 'Tag' : 'Tage'}`;
  }

  return `${String(from)} – ${String(to)} Tage`;
}
