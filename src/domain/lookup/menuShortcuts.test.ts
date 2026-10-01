import { describe, expect, it } from 'vitest';

import { ok } from '../shared/result';
import { decodeMenuGroups } from './menuShortcuts';

describe('decodeMenuGroups', () => {
  it('decodes the shortcuts by menu, as Rust sends them', () => {
    const groups = [
      {
        title: 'Ablage',
        shortcuts: [
          { title: 'Neues Fenster', keys: ['Meta', 'n'] },
          { title: 'Neuer Ordner', keys: ['Shift', 'Meta', 'n'] },
        ],
      },
    ];

    expect(decodeMenuGroups(groups)).toStrictEqual(ok(groups));
  });

  it('rejects a shortcut without keys', () => {
    const groups = [{ title: 'Ablage', shortcuts: [{ title: 'Neues Fenster', keys: [] }] }];

    expect(decodeMenuGroups(groups).kind).toBe('err');
  });
});
