import type { LayoutId } from '../keyboard/keymap';
import type { Grade, ReviewTime } from '../scheduling/scheduler';
import { decodeGrade } from '../scheduling/scheduler';
import type { Decoder } from '../shared/decode';
import { array, boolean, integer, object, optional } from '../shared/decode';

/**
 * A logged test as the overview and grading read it: when it was answered, its grade, and what
 * it was graded from. Reviews logged before key counts were stored have none.
 */
export type ReviewLogEntry = ReviewTime & {
  readonly grade: Grade;
  readonly failed: boolean;
  readonly durationMs: number;
  readonly keyCount?: number;
};

/** The review log of one keyboard layout, oldest entry first. */
export type LayoutLog = {
  readonly layout: LayoutId;
  readonly entries: readonly ReviewLogEntry[];
};

/** Decodes the review log, oldest entry first, as Rust sends it. */
export const decodeReviewLog: Decoder<readonly ReviewLogEntry[]> = array(
  object({
    at: integer,
    utcOffsetMinutes: integer,
    grade: decodeGrade,
    failed: boolean,
    durationMs: integer,
    keyCount: optional(integer),
  }),
);
