import { describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import type { PopoverOpened } from '@/domain/lookup/appInFront';
import type { MenuGroup } from '@/domain/lookup/menuShortcuts';
import { err, ok } from '@/domain/shared/result';
import type { Lookup } from '@/ports';

import { useLookup } from './useLookup';

const finder = { name: 'Finder', bundleId: 'com.apple.finder' };
const file: MenuGroup = {
  title: 'Ablage',
  shortcuts: [{ title: 'Neues Fenster', keys: ['Meta', 'n'] }],
};

/** Runs the lookup over a port whose popover the test opens. */
function start(port: Partial<Lookup> = {}) {
  const stopFollowing = vi.fn();
  const onPopoverOpened = vi.fn<Lookup['onPopoverOpened']>(() => stopFollowing);
  const logger = { warn: vi.fn(), error: vi.fn() };
  const fullPort: Lookup = {
    onPopoverOpened,
    askForMenuAccess: vi.fn(() => Promise.resolve(ok(undefined))),
    readMenuShortcuts: vi.fn(() => Promise.resolve(ok([file]))),
    ...port,
  };
  const scope = effectScope();
  const running = scope.run(() => useLookup([], fullPort, logger));

  if (running === undefined) {
    return expect.unreachable();
  }

  return {
    lookup: running[0],
    dispatch: running[1],
    port: fullPort,
    logger,
    stopFollowing,
    open: (opened: PopoverOpened) => {
      onPopoverOpened.mock.calls.forEach(([listener]) => {
        listener(opened);
      });
    },
    stop: () => {
      scope.stop();
    },
  };
}

describe('useLookup', () => {
  it('reads the menus of the app the popover opens over', async () => {
    const { lookup, open } = start();

    open({ app: finder, menuAccess: 'granted' });

    await vi.waitFor(() => {
      expect(lookup.value.screen).toStrictEqual({ kind: 'loaded', app: finder, groups: [file] });
    });
  });

  it('logs menus that could not be read', async () => {
    const { lookup, logger, open } = start({
      readMenuShortcuts: () => Promise.resolve(err({ kind: 'lookup', message: 'too late' })),
    });

    open({ app: finder, menuAccess: 'granted' });

    await vi.waitFor(() => {
      expect(lookup.value.screen).toStrictEqual({ kind: 'failed', app: finder });
    });
    expect(logger.error).toHaveBeenCalledWith('Could not read the menus: too late');
  });

  it('asks for access through the port', () => {
    const { port, dispatch, open } = start();

    open({ app: finder, menuAccess: 'denied' });
    dispatch({ type: 'accessAsked' });

    expect(port.askForMenuAccess).toHaveBeenCalledOnce();
  });

  it('stops following the popover with its component', () => {
    const { stop, stopFollowing } = start();

    stop();

    expect(stopFollowing).toHaveBeenCalledOnce();
  });
});
