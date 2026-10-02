import type { LayoutId } from '@/domain/keyboard/keymap';
import type { ProgressEffect } from '@/domain/practice/session';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { err } from '@/domain/shared/result';
import { localTimeAt } from '@/localTime';
import type { useProgressStore } from '@/stores/progress';

/** What saving practice results needs of the progress store. */
export type ProgressActions = Pick<
  ReturnType<typeof useProgressStore>,
  'recordReview' | 'saveLearning'
>;

/** Where practice results go: the app and layout, and for learning, the set. */
export type SaveTarget = {
  readonly appId: string;
  readonly layout: LayoutId;
  readonly setId?: string;
};

const noSet: PlatformError = { kind: 'storage', message: 'learning progress without a set' };

/**
 * Saves a practice session's results into the progress store, at the time `now` gives: a test
 * becomes a review with the local UTC offset, and learning goes into the target set's progress.
 */
export function progressSaver(
  progress: ProgressActions,
  { appId, layout, setId }: SaveTarget,
  now: () => number,
): (effect: ProgressEffect) => Promise<Result<void, PlatformError>> {
  return function save(effect) {
    const at = now();

    switch (effect.type) {
      case 'tested': {
        const { id, failed, durationMs, keyCount } = effect;

        return progress.recordReview({
          id,
          layout,
          ...localTimeAt(at),
          failed,
          durationMs,
          keyCount,
        });
      }
      case 'learningChanged':
        return setId === undefined
          ? Promise.resolve(err(noSet))
          : progress.saveLearning({ appId, setId, layout }, effect.snapshot, at);
    }
  };
}
