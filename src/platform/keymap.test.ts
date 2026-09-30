import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import { keymapSource } from './keymap';

describe('keymapSource', () => {
  it('loads the current layout with get_keymap', async () => {
    const characters = { value: 'a', withShift: 'A', withAlt: 'å', withShiftAlt: 'Å' };
    const layout = { id: 'com.apple.keylayout.German', keymap: { KeyA: characters } };
    const invoke = vi.fn(() => Promise.resolve(layout));

    await expect(keymapSource(invoke).load()).resolves.toStrictEqual(ok(layout));
    expect(invoke).toHaveBeenCalledWith('get_keymap', undefined);
  });
});
