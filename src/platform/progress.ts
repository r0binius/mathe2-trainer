import type { ProgressRepository } from '@/domain/progress/repository';
import { decodeReviewLog } from '@/domain/progress/reviewLog';
import { decodeStoredProgress } from '@/domain/progress/storedProgress';

import type { Invoke } from './ipc';
import { commandCaller, nothing } from './ipc';

/** Learning progress, cards and the review log, kept by the Rust side in its database. */
export function progressRepository(invoke: Invoke): ProgressRepository {
  const call = commandCaller(invoke);

  return {
    load: () => call('load_progress', decodeStoredProgress),
    loadLog: (layout, since) => call('load_review_log', decodeReviewLog, { layout, since }),
    saveSet: (record) => call('save_set_progress', nothing, { record }),
    // `null` rather than a missing argument: Rust reads either as `None`, and `null` is explicit.
    recordReview: (review, card) => call('record_review', nothing, { review, card: card ?? null }),
    replace: (progress) => call('replace_progress', nothing, { progress }),
    reset: () => call('reset_progress', nothing),
  };
}
