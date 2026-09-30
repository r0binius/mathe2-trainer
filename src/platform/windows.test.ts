import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import type { Listen } from './ipc';
import { windows } from './windows';

const unused = vi.fn();
const logger = { warn: vi.fn(), error: vi.fn() };

describe('windows', () => {
  it('dismisses the popover with dismiss_popover', async () => {
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(windows(invoke, unused, logger).dismissPopover()).resolves.toStrictEqual(
      ok(undefined),
    );
    expect(invoke).toHaveBeenCalledWith('dismiss_popover', undefined);
  });

  it('calls the listener on options-requested', () => {
    const listen = vi.fn<Listen>(() => Promise.resolve(vi.fn()));
    const listener = vi.fn();

    windows(unused, listen, logger).onOptionsRequested(listener);

    expect(listen).toHaveBeenCalledWith('options-requested', listener);
  });
});
