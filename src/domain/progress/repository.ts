import type { Recall } from '../practice/grading';
import type { Card, Review } from '../scheduling/scheduler';
import type { Result } from '../shared/result';
import type { StorageError } from '../shared/storage';
import type { LoadedProgress, SetRecord, StoredProgress } from './storedProgress';

/** A review as the log keeps it: the grade and what it was graded from. */
export type LoggedReview = Review & Recall;

/** Where learning progress, cards and the review log are kept. */
export type ProgressRepository = {
  /** All set records and cards, on every layout, and the stored items that no longer decode. */
  readonly load: () => Promise<Result<LoadedProgress, StorageError>>;
  readonly saveSet: (record: SetRecord) => Promise<Result<void, StorageError>>;
  /** Logs a review and stores the card it produced, together. A failed first test has none. */
  readonly recordReview: (
    review: LoggedReview,
    card: Card | undefined,
  ) => Promise<Result<void, StorageError>>;
  /** Replaces all set records and cards, such as with reconciled ones. The log stays. */
  readonly replace: (progress: StoredProgress) => Promise<Result<void, StorageError>>;
  /** Deletes all progress, cards and the review log. */
  readonly reset: () => Promise<Result<void, StorageError>>;
};
