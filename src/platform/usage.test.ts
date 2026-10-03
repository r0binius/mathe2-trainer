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
});
