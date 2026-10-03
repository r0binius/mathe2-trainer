// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createApp, h } from 'vue';

import BaseButton from './BaseButton.vue';

/** The button as rendered with `props`. */
function rendered(props: Readonly<Record<string, unknown>>): HTMLButtonElement | null {
  const host = document.createElement('div');
  createApp({ render: () => h(BaseButton, props, () => 'Learn') }).mount(host);

  return host.querySelector('button');
}

describe('BaseButton', () => {
  it('is a plain button, not a toggle, unless it stands for a choice', () => {
    // An `aria-pressed` makes VoiceOver announce a toggle, which WebKit reports as a checkbox.
    expect(rendered({})?.hasAttribute('aria-pressed')).toBe(false);
  });

  it('says whether a choice is the one chosen', () => {
    expect(rendered({ pressed: false })?.getAttribute('aria-pressed')).toBe('false');
    expect(rendered({ pressed: true })?.getAttribute('aria-pressed')).toBe('true');
  });
});
