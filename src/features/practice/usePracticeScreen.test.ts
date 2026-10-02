// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { createApp, effectScope, nextTick, ref } from 'vue';

import type { Keymap } from '@/domain/keyboard/keymap';
import { reviewPool, reviewStrategy } from '@/domain/practice/review';
import type { PracticeItem } from '@/domain/practice/session';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { SummaryContext } from '@/domain/progress/summary';
import { ok } from '@/domain/shared/result';
import { missingProgressRepository, progressRepositoryKey } from '@/ports';
import { useProgressStore } from '@/stores/progress';

import { usePracticeScreen } from './usePracticeScreen';

const german = 'com.apple.keylayout.German';
const keymap: Keymap = { KeyK: { value: 'k', withShift: 'K', withAlt: '°', withShiftAlt: '' } };
const item: PracticeItem = { id: 'app/Meta+k', keys: ['Meta', 'k'], title: 'k' };

const context: SummaryContext = {
  keymap,
  layout: german,
  policy: [],
  progress: { sets: [], cards: [] },
  endOfToday: 0,
};

const repository: ProgressRepository = {
  ...missingProgressRepository,
  load: () => Promise.resolve(ok({ progress: { sets: [], cards: [] }, skipped: [] })),
  recordReview: vi.fn(() => Promise.resolve(ok(undefined))),
  reset: () => Promise.resolve(ok(undefined)),
};

/** A review of one shortcut in a screen, with loaded progress, whose context the test changes. */
async function review(items: readonly PracticeItem[] = [item]) {
  const app = createApp({}).provide(progressRepositoryKey, repository);
  const pinia = createPinia();
  app.use(pinia);
  setActivePinia(pinia);
  const progress = app.runWithContext(() => useProgressStore());
  await progress.load([]);
  const current = ref(context);
  const leave = vi.fn();
  const scope = effectScope();
  onTestFinished(() => {
    scope.stop();
  });
  app.runWithContext(() =>
    scope.run(() =>
      usePracticeScreen(
        {
          strategy: reviewStrategy,
          pool: reviewPool(items),
          target: { appId: 'app', layout: german },
        },
        { context: () => current.value, leave },
      ),
    ),
  );

  return { progress, current, leave };
}

describe('usePracticeScreen', () => {
  it('saves a recalled shortcut as a review on the layout', async () => {
    await review();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', metaKey: true }));

    await vi.waitFor(() => {
      expect(repository.recordReview).toHaveBeenCalledWith(
        expect.objectContaining({ id: item.id, layout: german, failed: false }),
        expect.anything(),
      );
    });
  });

  it('leaves right away when there is nothing to practice', async () => {
    const { leave } = await review([]);

    expect(leave).toHaveBeenCalledOnce();
  });

  it('leaves once the progress is reset', async () => {
    const { progress, leave } = await review();

    await progress.reset();
    await nextTick();

    expect(leave).toHaveBeenCalledOnce();
  });

  it('leaves once the layout changes', async () => {
    const { current, leave } = await review();

    current.value = { ...context, layout: 'com.apple.keylayout.US' };
    await nextTick();

    expect(leave).toHaveBeenCalledOnce();
  });
});
