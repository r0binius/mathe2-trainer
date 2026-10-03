import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import { coach } from './coach';
import type { Listen } from './ipc';

const logger = { warn: vi.fn(), error: vi.fn() };

describe('coach', () => {
  it('loads what is allowed with get_coach_access', async () => {
    const access = { menus: 'granted', input: 'denied' };
    const invoke = vi.fn(() => Promise.resolve(access));

    await expect(coach(invoke, vi.fn<Listen>(), logger).load()).resolves.toStrictEqual(ok(access));
    expect(invoke).toHaveBeenCalledWith('get_coach_access', undefined);
  });

  it.each([
    ['menus', 'ask_for_menu_access'],
    ['input', 'ask_for_input_access'],
  ] as const)('asks for %s with %s', async (permission, command) => {
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(coach(invoke, vi.fn<Listen>(), logger).askFor(permission)).resolves.toStrictEqual(
      ok(undefined),
    );
    expect(invoke).toHaveBeenCalledWith(command, undefined);
  });

  it('follows menu-chosen with its decoded payload', () => {
    const choice = { bundleId: 'com.apple.Notes', keys: ['Meta', 'n'] };
    const listen = vi.fn<Listen>((_event, handler) => {
      handler({ payload: choice });
      return Promise.resolve(vi.fn());
    });
    const listener = vi.fn();

    coach(vi.fn(), listen, logger).onMenuChosen(listener);

    expect(listen).toHaveBeenCalledWith('menu-chosen', expect.any(Function));
    expect(listener).toHaveBeenCalledWith(choice);
  });

  it('shows a banner with show_banner', async () => {
    const banner = { title: 'Als Galerie', keys: ['Meta', '2'] };
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(coach(invoke, vi.fn<Listen>(), logger).showBanner(banner)).resolves.toStrictEqual(
      ok(undefined),
    );
    expect(invoke).toHaveBeenCalledWith('show_banner', { banner });
  });

  it('follows banner-shown with its decoded payload', () => {
    const banner = { title: 'Als Galerie', keys: ['Meta', '2'] };
    const listen = vi.fn<Listen>((_event, handler) => {
      handler({ payload: banner });
      return Promise.resolve(vi.fn());
    });
    const listener = vi.fn();

    coach(vi.fn(), listen, logger).onBannerShown(listener);

    expect(listen).toHaveBeenCalledWith('banner-shown', expect.any(Function));
    expect(listener).toHaveBeenCalledWith(banner);
  });

  it('watches shortcuts with set_watched_shortcuts', async () => {
    const shortcuts = [
      { id: 'notes/Meta+n', bundleIds: ['com.apple.Notes'], keys: ['Meta', 'n'] },
    ] as const;
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(
      coach(invoke, vi.fn<Listen>(), logger).setWatched(shortcuts),
    ).resolves.toStrictEqual(ok(undefined));
    expect(invoke).toHaveBeenCalledWith('set_watched_shortcuts', { shortcuts });
  });

  it('follows key-used with the shortcut pressed', () => {
    const listen = vi.fn<Listen>((_event, handler) => {
      handler({ payload: { id: 'notes/Meta+n' } });
      return Promise.resolve(vi.fn());
    });
    const listener = vi.fn();

    coach(vi.fn(), listen, logger).onKeyUsed(listener);

    expect(listen).toHaveBeenCalledWith('key-used', expect.any(Function));
    expect(listener).toHaveBeenCalledWith('notes/Meta+n');
  });
});
