import { inject } from 'vue';

import type { KeyLabel } from '@/domain/keyboard/labels';
import { labelKey } from '@/domain/keyboard/labels';
import { keyLabelsKey, missingKeyLabels } from '@/ports';

/** How to show keys on this platform, with the labels the app provides: `labelOf('Meta')` is ⌘. */
export function useKeyLabels(): (key: string) => KeyLabel {
  const labels = inject(keyLabelsKey, missingKeyLabels);

  return function labelOf(key) {
    return labelKey(labels, key);
  };
}
