import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import { windows } from './windows';

describe('windows', () => {
  it('dismisses the popover with dismiss_popover', async () => {
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(windows(invoke).dismissPopover()).resolves.toStrictEqual(ok(undefined));
    expect(invoke).toHaveBeenCalledWith('dismiss_popover', undefined);
  });
});
