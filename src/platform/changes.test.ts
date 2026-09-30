import { describe, expect, it, vi } from 'vitest';

import { changes } from './changes';
import type { Listen } from './ipc';

describe('changes', () => {
  it('follows the events the Rust side sends every window', () => {
    const listen = vi.fn<Listen>(() => Promise.resolve(vi.fn()));
    const listener = vi.fn();
    const followed = changes(listen, { warn: vi.fn(), error: vi.fn() });

    followed.onSettingsChanged(listener);
    followed.onProgressReset(listener);

    expect(listen).toHaveBeenCalledWith('settings-changed', listener);
    expect(listen).toHaveBeenCalledWith('progress-reset', listener);
  });
});
