// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { err, ok } from '@/domain/shared/result';
import type { CoachPermissions } from '@/ports';

import { useCoachAccess } from './useCoachAccess';

const denied = { menus: 'denied', input: 'granted' } as const;

/** The access of a window whose switch the test turns, over a port that answers `denied`. */
function watch(on: boolean, port: Partial<CoachPermissions> = {}) {
  const enabled = ref(on);
  const logger = { warn: vi.fn(), error: vi.fn() };
  const fullPort: CoachPermissions = {
    load: vi.fn(() => Promise.resolve(ok(denied))),
    askFor: vi.fn(() => Promise.resolve(ok(undefined))),
    ...port,
  };
  const scope = effectScope();
  onTestFinished(() => {
    scope.stop();
  });
  const running = scope.run(() => useCoachAccess(fullPort, () => enabled.value, logger));

  if (running === undefined) {
    return expect.unreachable();
  }

  return { access: running[0], askFor: running[1], enabled, port: fullPort, logger };
}

describe('useCoachAccess', () => {
  it('asks what is allowed while learning from work is on', async () => {
    const { access } = watch(true);

    await vi.waitFor(() => {
      expect(access.value).toStrictEqual(denied);
    });
  });

  it('asks nothing while it is off', async () => {
    const { port } = watch(false);

    await nextTick();

    expect(port.load).not.toHaveBeenCalled();
  });

  it('asks once it is turned on', async () => {
    const { port, enabled } = watch(false);

    enabled.value = true;
    await nextTick();

    expect(port.load).toHaveBeenCalledOnce();
  });

  it('asks again when the window gains focus, such as back from System Settings', async () => {
    const { port } = watch(true);

    window.dispatchEvent(new FocusEvent('focus'));
    await nextTick();

    expect(port.load).toHaveBeenCalledTimes(2);
  });

  it('opens System Settings for a permission, and logs when it cannot', async () => {
    const { askFor, port, logger } = watch(true, {
      askFor: vi.fn<CoachPermissions['askFor']>(() =>
        Promise.resolve(err({ kind: 'lookup', message: 'no settings' })),
      ),
    });

    askFor('input');

    expect(port.askFor).toHaveBeenCalledWith('input');
    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Could not open System Settings: no settings');
    });
  });
});
