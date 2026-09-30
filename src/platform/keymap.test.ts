import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import type { Listen } from './ipc';
import { keymapSource } from './keymap';

const unused = vi.fn();

describe('keymapSource', () => {
  it('loads the current layout with get_keymap', async () => {
    const characters = { value: 'a', withShift: 'A', withAlt: 'å', withShiftAlt: 'Å' };
    const layout = { id: 'com.apple.keylayout.German', keymap: { KeyA: characters } };
    const invoke = vi.fn(() => Promise.resolve(layout));

    await expect(keymapSource(invoke, unused).load()).resolves.toStrictEqual(ok(layout));
    expect(invoke).toHaveBeenCalledWith('get_keymap', undefined);
  });

  it('calls the listener on keymap-changed until it is stopped', async () => {
    const unlisten = vi.fn();
    const listen = vi.fn<Listen>(() => Promise.resolve(unlisten));
    const listener = vi.fn();

    const stop = keymapSource(unused, listen).onChange(listener);
    listen.mock.calls[0]?.[1]();
    stop();
    await Promise.resolve();

    expect(listen).toHaveBeenCalledWith('keymap-changed', listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(unlisten).toHaveBeenCalledOnce();
  });
});
