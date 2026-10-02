// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { useWindowListener } from './useWindowListener';

describe('useWindowListener', () => {
  it("calls the listener on the window's events while its scope lives", () => {
    const listener = vi.fn();
    effectScope().run(() => {
      useWindowListener('focus', listener);
    });

    window.dispatchEvent(new FocusEvent('focus'));

    expect(listener).toHaveBeenCalledOnce();
  });

  it('stops listening with its scope', () => {
    const listener = vi.fn();
    const scope = effectScope();
    scope.run(() => {
      useWindowListener('focus', listener);
    });

    scope.stop();
    window.dispatchEvent(new FocusEvent('focus'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops a capturing listener too, which only goes with the same capture flag', () => {
    const listener = vi.fn();
    const scope = effectScope();
    scope.run(() => {
      useWindowListener('keydown', listener, { capture: true });
    });

    scope.stop();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(listener).not.toHaveBeenCalled();
  });
});
