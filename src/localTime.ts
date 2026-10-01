import type { ReviewTime } from './domain/scheduling/scheduler';

/**
 * A moment with the system's UTC offset at that moment, in minutes east of UTC, which the domain
 * counts local days with. The offset of each moment, not today's: it changes with summer time.
 */
export function localTimeAt(at: number): ReviewTime {
  return { at, utcOffsetMinutes: -new Date(at).getTimezoneOffset() };
}
