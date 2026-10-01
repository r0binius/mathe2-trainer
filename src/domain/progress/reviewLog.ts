import type { Grade, ReviewTime } from '../scheduling/scheduler';
import { decodeGrade } from '../scheduling/scheduler';
import type { Decoder } from '../shared/decode';
import { array, integer, object } from '../shared/decode';

/** A logged test as the overview reads it: when it was answered, and its grade. */
export type ReviewLogEntry = ReviewTime & { readonly grade: Grade };

/** Decodes the review log, oldest entry first, as Rust sends it. */
export const decodeReviewLog: Decoder<readonly ReviewLogEntry[]> = array(
  object({ at: integer, utcOffsetMinutes: integer, grade: decodeGrade }),
);
