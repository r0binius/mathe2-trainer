// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, useTemplateRef } from 'vue';

import { useSpatialNav } from './useSpatialNav';

/** Where each link sits: two cards side by side, as in the library. */
const boxes = [
  { left: 0, top: 0, right: 100, bottom: 50 },
  { left: 112, top: 0, right: 212, bottom: 50 },
];

/** Mounts a screen with two links that uses spatial navigation, and returns its links. */
function mountScreen(back: () => void) {
  const Screen = defineComponent(() => {
    const root = useTemplateRef<HTMLElement>('root');
    useSpatialNav(() => root.value, back);

    return () =>
      h('div', { ref: 'root' }, [h('a', { href: '#/a' }, 'a'), h('a', { href: '#/b' }, 'b')]);
  });
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(Screen);
  app.mount(host);

  const links = [...host.querySelectorAll('a')];
  links.forEach((link, index) => {
    vi.spyOn(link, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect(asRect(index)));
  });

  return {
    links,
    unmount: () => {
      app.unmount();
    },
  };
}

function asRect(index: number): DOMRectInit {
  const { left, top, right, bottom } = boxes[index] ?? { left: 0, top: 0, right: 0, bottom: 0 };

  return { x: left, y: top, width: right - left, height: bottom - top };
}

function press(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('useSpatialNav', () => {
  it('focuses the first element, the main action, when the screen opens', () => {
    const { links } = mountScreen(vi.fn());

    expect(document.activeElement).toBe(links[0]);
  });

  it('moves focus with the arrow keys', () => {
    const { links } = mountScreen(vi.fn());

    press('ArrowRight');

    expect(document.activeElement).toBe(links[1]);
  });

  it('goes back with Escape, and with ← once nothing lies to the left', () => {
    const back = vi.fn();
    mountScreen(back);

    press('Escape');
    press('ArrowLeft');

    expect(back).toHaveBeenCalledTimes(2);
  });

  it('opens the focused link with → once nothing lies to the right', () => {
    const { links } = mountScreen(vi.fn());
    const opened = vi.fn((event: Event) => {
      event.preventDefault();
    });
    links[1]?.addEventListener('click', opened);

    press('ArrowRight');
    press('ArrowRight');

    expect(opened).toHaveBeenCalledOnce();
  });

  it('leaves keys alone while focus is elsewhere, such as on a screen sliding in', () => {
    const back = vi.fn();
    mountScreen(back);
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();

    press('Escape');

    expect(back).not.toHaveBeenCalled();
  });

  it('stops listening when the screen goes away', () => {
    const back = vi.fn();
    const { unmount } = mountScreen(back);

    unmount();
    press('Escape');

    expect(back).not.toHaveBeenCalled();
  });
});
