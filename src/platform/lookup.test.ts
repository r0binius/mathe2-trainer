import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import type { Listen } from './ipc';
import { lookup } from './lookup';

describe('lookup', () => {
  it('follows popover-opened with its decoded payload', () => {
    const listen = vi.fn<Listen>((_event, handler) => {
      handler({ payload: { app: { name: 'Notizen' }, menuAccess: 'granted' } });
      return Promise.resolve(vi.fn());
    });
    const listener = vi.fn();

    lookup(vi.fn(), listen, { warn: vi.fn(), error: vi.fn() }).onPopoverOpened(listener);

    expect(listen).toHaveBeenCalledWith('popover-opened', expect.any(Function));
    expect(listener).toHaveBeenCalledWith({ app: { name: 'Notizen' }, menuAccess: 'granted' });
  });

  it('asks for access to the menus with ask_for_menu_access', async () => {
    const invoke = vi.fn(() => Promise.resolve(null));
    const listen = vi.fn<Listen>();

    await expect(
      lookup(invoke, listen, { warn: vi.fn(), error: vi.fn() }).askForMenuAccess(),
    ).resolves.toStrictEqual(ok(undefined));
    expect(invoke).toHaveBeenCalledWith('ask_for_menu_access', undefined);
  });

  it('reads the menu shortcuts with read_menu_shortcuts', async () => {
    const groups = [
      { title: 'Ablage', shortcuts: [{ title: 'Neues Fenster', keys: ['Meta', 'n'] }] },
    ];
    const invoke = vi.fn(() => Promise.resolve(groups));
    const listen = vi.fn<Listen>();

    await expect(
      lookup(invoke, listen, { warn: vi.fn(), error: vi.fn() }).readMenuShortcuts(),
    ).resolves.toStrictEqual(ok(groups));
    expect(invoke).toHaveBeenCalledWith('read_menu_shortcuts', undefined);
  });
});
