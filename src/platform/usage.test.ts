import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import { usageRepository } from './usage';

describe('usageRepository', () => {
  it('counts a menu use with record_menu_use', async () => {
    const menuUse = {
      id: 'notes/Meta+n',
      layout: 'com.apple.keylayout.German',
      day: 20_000,
    } as const;
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(usageRepository(invoke).recordMenuUse(menuUse)).resolves.toStrictEqual(
      ok(undefined),
    );
    expect(invoke).toHaveBeenCalledWith('record_menu_use', { menuUse });
  });
});
