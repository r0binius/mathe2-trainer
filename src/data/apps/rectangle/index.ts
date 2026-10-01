import type { AppDefinition } from '@/domain/shortcuts/types';

import de from './de.json';
import en from './en.json';

/**
 * Rectangle's recommended default shortcuts, plus the Todo shortcuts set in its settings, as of
 * 2026-09-25.
 */
export const rectangle = {
  id: 'rectangle',
  title: 'Rectangle',
  bundleIds: ['com.knollsoft.Rectangle'],
  category: 'system',
  catalogs: { de, en },
  sets: [
    {
      id: 'halves',
      title: 'halves.title',
      shortcuts: [
        { title: 'halves.left', keys: [['Control', 'Alt', 'ArrowLeft']] },
        { title: 'halves.right', keys: [['Control', 'Alt', 'ArrowRight']] },
        { title: 'halves.top', keys: [['Control', 'Alt', 'ArrowUp']] },
        { title: 'halves.bottom', keys: [['Control', 'Alt', 'ArrowDown']] },
        { title: 'halves.topLeft', keys: [['Control', 'Alt', 'u']] },
        { title: 'halves.topRight', keys: [['Control', 'Alt', 'i']] },
        { title: 'halves.bottomLeft', keys: [['Control', 'Alt', 'j']] },
        { title: 'halves.bottomRight', keys: [['Control', 'Alt', 'k']] },
      ],
    },
    {
      id: 'thirds',
      title: 'thirds.title',
      shortcuts: [
        { title: 'thirds.first', keys: [['Control', 'Alt', 'd']] },
        { title: 'thirds.center', keys: [['Control', 'Alt', 'f']] },
        { title: 'thirds.last', keys: [['Control', 'Alt', 'g']] },
        { title: 'thirds.firstTwo', keys: [['Control', 'Alt', 'e']] },
        { title: 'thirds.lastTwo', keys: [['Control', 'Alt', 't']] },
      ],
    },
    {
      id: 'size',
      title: 'size.title',
      shortcuts: [
        { title: 'size.maximize', keys: [['Control', 'Alt', 'Enter']] },
        { title: 'size.maximizeHeight', keys: [['Control', 'Alt', 'Shift', 'ArrowUp']] },
        // Rectangle's defaults are the keys right of 0: `ß` and `´` on German, `-` and `=` on US.
        {
          title: 'size.smaller',
          keys: [
            ['Control', 'Alt', 'ß'],
            ['Control', 'Alt', '-'],
          ],
        },
        {
          title: 'size.larger',
          keys: [
            ['Control', 'Alt', '´'],
            ['Control', 'Alt', '='],
          ],
        },
        { title: 'size.center', keys: [['Control', 'Alt', 'c']] },
        { title: 'size.restore', keys: [['Control', 'Alt', 'Backspace']] },
        { title: 'size.nextDisplay', keys: [['Control', 'Alt', 'Meta', 'ArrowRight']] },
        { title: 'size.previousDisplay', keys: [['Control', 'Alt', 'Meta', 'ArrowLeft']] },
      ],
    },
    {
      id: 'todo',
      title: 'todo.title',
      shortcuts: [
        { title: 'todo.toggle', keys: [['Control', 'Alt', 'b']] },
        { title: 'todo.reflow', keys: [['Control', 'Alt', 'n']] },
      ],
    },
  ],
} satisfies AppDefinition;
