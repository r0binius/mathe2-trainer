// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import type { KeyCombination } from '@/domain/keyboard/combination';
import type { Keymap } from '@/domain/keyboard/keymap';

import { useKeyCapture } from './useKeyCapture';

const keymap: Keymap = {
  KeyZ: { value: 'y', withShift: 'Y', withAlt: '¥', withShiftAlt: 'Á' },
  KeyY: { value: 'z', withShift: 'Z', withAlt: 'Ω', withShiftAlt: 'ˇ' },
};

function capture() {
  const answers = vi.fn<(keys: KeyCombination) => void>();
  const scope = effectScope();
  const held = scope.run(() => useKeyCapture(() => keymap, answers));

  if (held === undefined) {
    return expect.unreachable();
  }

  return {
    held,
    answers,
    stop: () => {
      scope.stop();
    },
  };
}

function key(type: 'keydown' | 'keyup', code: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent(type, { code, cancelable: true, ...init });
  window.dispatchEvent(event);

  return event;
}

describe('useKeyCapture', () => {
  it('shows the modifiers while they are held, then the key with them', () => {
    const { held } = capture();

    key('keydown', 'MetaLeft', { metaKey: true });
    expect(held.value).toStrictEqual(['Meta']);

    key('keydown', 'KeyY', { metaKey: true });
    expect(held.value).toStrictEqual(['Meta', 'z']);
  });

  it('answers once a key goes down, named for the keymap', () => {
    const { answers } = capture();

    key('keydown', 'MetaLeft', { metaKey: true });
    key('keydown', 'KeyY', { metaKey: true });

    expect(answers).toHaveBeenCalledExactlyOnceWith(['Meta', 'z']);
  });

  it("keeps the browser and webview from acting on the keys, such as ⌘R's reload", () => {
    capture();

    expect(key('keydown', 'KeyR', { metaKey: true }).defaultPrevented).toBe(true);
  });

  it('ignores the repeats of a key held down', () => {
    const { answers } = capture();

    key('keydown', 'KeyY', { repeat: true });

    expect(answers).not.toHaveBeenCalled();
  });

  it('lets go of a key when it goes up, keeping the modifiers still down', () => {
    const { held } = capture();

    key('keydown', 'KeyY', { metaKey: true });
    key('keyup', 'KeyY', { metaKey: true });

    expect(held.value).toStrictEqual(['Meta']);
  });

  it('lets go of everything when the window loses focus, such as after ⌘Tab', () => {
    const { held } = capture();

    key('keydown', 'MetaLeft', { metaKey: true });
    window.dispatchEvent(new Event('blur'));

    expect(held.value).toStrictEqual([]);
  });

  it('stops listening once its scope ends', () => {
    const { answers, stop } = capture();

    stop();
    key('keydown', 'KeyY');

    expect(answers).not.toHaveBeenCalled();
  });
});
