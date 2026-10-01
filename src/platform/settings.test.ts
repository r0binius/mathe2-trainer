import { describe, expect, it, vi } from 'vitest';

import type { Settings } from '@/domain/settings/settings';
import { ok } from '@/domain/shared/result';

import { settingsRepository } from './settings';

const settings: Settings = {
  trigger: { kind: 'holdCommand' },
  showMenuBarIcon: true,
  showDockIcon: false,
  language: 'system',
};

describe('settingsRepository', () => {
  it('loads the settings with get_settings', async () => {
    const invoke = vi.fn(() => Promise.resolve(settings));

    await expect(settingsRepository(invoke).load()).resolves.toStrictEqual(ok(settings));
    expect(invoke).toHaveBeenCalledWith('get_settings', undefined);
  });

  it('saves the settings with set_settings', async () => {
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(settingsRepository(invoke).save(settings)).resolves.toStrictEqual(ok(undefined));
    expect(invoke).toHaveBeenCalledWith('set_settings', { settings });
  });
});
