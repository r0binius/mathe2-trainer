import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import type { KeyLabels } from '@/domain/keyboard/labels';
import { macosKeyLabels } from '@/domain/keyboard/labels';
import { keyLabelsKey } from '@/ports';

import { useKeyLabels } from './useKeyLabels';

/** `labelOf` in an app that provides `labels`, or none. */
function labelsFrom(labels?: KeyLabels) {
  const app = createApp({});

  if (labels !== undefined) {
    app.provide(keyLabelsKey, labels);
  }

  return app.runWithContext(() => useKeyLabels());
}

describe('useKeyLabels', () => {
  it('labels keys with the labels the app provides', () => {
    const labelOf = labelsFrom(macosKeyLabels);

    expect(labelOf('Meta')).toStrictEqual({ symbol: '⌘', name: 'Cmd' });
    expect(labelOf('k')).toStrictEqual({ symbol: 'K' });
  });

  it('shows keys by their names when the app provided no labels', () => {
    expect(labelsFrom()('Meta')).toStrictEqual({ symbol: 'Meta' });
  });
});
