import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import { usageRepository } from './usage';

describe('usageRepository', () => {
  it('counts a use with record_use', async () => {
    const shortcutUse = {
      id: 'notes/Meta+n',
      layout: 'com.apple.keylayout.German',
      day: 20_000,
      by: 'keys',
    } as const;
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(usageRepository(invoke).recordUse(shortcutUse)).resolves.toStrictEqual(
      ok(undefined),
    );
    expect(invoke).toHaveBeenCalledWith('record_use', { shortcutUse });
  });

  it('loads the counts of a layout with load_usage', async () => {
    const counts = [{ id: 'notes/Meta+n', day: 20_000, byKeys: 2, byMenu: 1 }];
    const invoke = vi.fn(() => Promise.resolve(counts));

    await expect(
      usageRepository(invoke).load('com.apple.keylayout.German', 20_000),
    ).resolves.toStrictEqual(ok(counts));
    expect(invoke).toHaveBeenCalledWith('load_usage', {
      layout: 'com.apple.keylayout.German',
      since: 20_000,
    });
  });
});
