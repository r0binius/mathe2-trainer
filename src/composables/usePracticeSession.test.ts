// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, effectScope } from 'vue';

import type { Keymap } from '@/domain/keyboard/keymap';
import { reviewPool, reviewStrategy } from '@/domain/practice/review';
import type { PracticeItem, ProgressEffect } from '@/domain/practice/session';
import { successPauseMs } from '@/domain/practice/session';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import type { StorageError } from '@/domain/shared/storage';

import type { PracticeShell } from './usePracticeSession';
import { usePracticeSession } from './usePracticeSession';

const keymap: Keymap = {
  KeyA: { value: 'a', withShift: 'A', withAlt: 'å', withShiftAlt: 'Å' },
  KeyB: { value: 'b', withShift: 'B', withAlt: '∫', withShiftAlt: 'ı' },
};

const a: PracticeItem = { id: 'app/Meta+a', keys: ['Meta', 'a'], title: 'a' };
const b: PracticeItem = { id: 'app/Meta+b', keys: ['Meta', 'b'], title: 'b' };

type Save = (effect: ProgressEffect) => Promise<Result<void, StorageError>>;

function practice(save: Save = () => Promise.resolve(ok(undefined))) {
  const shell: PracticeShell = { keymap: () => keymap, save, now: () => 1000, random: () => 0 };
  const scope = effectScope();
  // In an app, as in a screen: the session injects the app's logger.
  const running = createApp({}).runWithContext(() =>
    scope.run(() => usePracticeSession(reviewStrategy, reviewPool([a, b]), shell)),
  );

  if (running === undefined) {
    return expect.unreachable();
  }

  const [view, { skip, forget }] = running;

  return {
    view,
    skip,
    forget,
    stop: () => {
      scope.stop();
    },
  };
}

function press(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, metaKey: true }));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePracticeSession', () => {
  it('presents the first item, shown now', () => {
    const { view } = practice();

    expect(view.session.value).toMatchObject({ phase: 'presenting', item: a, shownAt: 1000 });
  });

  it('answers with the keys pressed, and saves what the session reports', () => {
    const save = vi.fn<Save>(() => Promise.resolve(ok(undefined)));
    const { view } = practice(save);

    press('KeyA');

    expect(view.session.value).toMatchObject({ phase: 'succeeded', item: a });
    expect(save).toHaveBeenCalledExactlyOnceWith({
      type: 'tested',
      id: a.id,
      failed: false,
      durationMs: 0,
    });
  });

  it('moves on to the next item once the success was shown', () => {
    const { view } = practice();

    press('KeyA');
    vi.advanceTimersByTime(successPauseMs);

    expect(view.session.value).toMatchObject({ phase: 'presenting', item: b });
  });

  it('skips to the next item', () => {
    const { view, skip } = practice();

    skip();

    expect(view.session.value).toMatchObject({ phase: 'presenting', item: b });
  });

  it('reveals the keys of a forgotten test', () => {
    const { view, forget } = practice();

    forget();

    expect(view.session.value).toMatchObject({ phase: 'presenting', failure: { kind: 'forgot' } });
  });

  it('shows the keys held', () => {
    const { view } = practice();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'MetaLeft', metaKey: true }));

    expect(view.held.value).toStrictEqual(['Meta']);
  });

  it('keeps going when saving fails, and says so', async () => {
    const locked = { kind: 'database', message: 'database is locked' } as const;
    const { view } = practice(() => Promise.resolve(err(locked)));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    press('KeyA');
    await vi.runAllTimersAsync();

    expect(view.saveFailed.value).toBe(true);
    expect(view.session.value).toMatchObject({ phase: 'presenting', item: b });
  });

  it('stops its pause once it goes away, so nothing moves on', () => {
    const { view, stop } = practice();

    press('KeyA');
    stop();
    vi.advanceTimersByTime(successPauseMs);

    expect(view.session.value).toMatchObject({ phase: 'succeeded', item: a });
  });
});
