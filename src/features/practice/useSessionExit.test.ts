import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import type { Session } from '@/domain/practice/session';

import { useSessionExit } from './useSessionExit';

const presenting: Session<undefined> = {
  phase: 'presenting',
  pool: undefined,
  item: { id: 'app/Meta+k', keys: ['Meta', 'k'], title: 'k' },
  mode: 'training',
  presentation: 1,
  shownAt: 0,
  misses: 0,
};

function watchSession(initial: Session<undefined>) {
  const session = ref<Session<undefined>>(initial);
  const origin = ref('0/com.apple.keylayout.German');
  const leave = vi.fn();
  effectScope().run(() => {
    useSessionExit(
      () => session.value,
      () => origin.value,
      leave,
    );
  });

  return { session, origin, leave };
}

describe('useSessionExit', () => {
  it('stays while the session runs', async () => {
    const { leave } = watchSession(presenting);

    await nextTick();

    expect(leave).not.toHaveBeenCalled();
  });

  it('leaves once the session finishes', async () => {
    const { session, leave } = watchSession(presenting);

    session.value = { phase: 'finished', pool: undefined };
    await nextTick();

    expect(leave).toHaveBeenCalledOnce();
  });

  it('leaves right away when there was nothing to practice', () => {
    const { leave } = watchSession({ phase: 'finished', pool: undefined });

    expect(leave).toHaveBeenCalledOnce();
  });

  it('leaves when what the session started from changes, such as after a reset', async () => {
    const { origin, leave } = watchSession(presenting);

    origin.value = '1/com.apple.keylayout.German';
    await nextTick();

    expect(leave).toHaveBeenCalledOnce();
  });
});
