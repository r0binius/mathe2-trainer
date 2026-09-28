import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { decodeSettings } from './settings';

const defaults = {
  trigger: { kind: 'holdCommand' },
  showMenuBarIcon: true,
  showDockIcon: true,
  launchAtLogin: true,
};

describe('decodeSettings', () => {
  it('decodes the settings, as Rust sends them', () => {
    expect(decodeSettings(defaults)).toStrictEqual(ok(defaults));
  });

  it('decodes a shortcut as the trigger', () => {
    const settings = { ...defaults, trigger: { kind: 'shortcut', keys: ['Shift', 'Meta', 'm'] } };

    expect(decodeSettings(settings)).toStrictEqual(ok(settings));
  });

  it('rejects an unknown trigger', () => {
    expect(decodeSettings({ ...defaults, trigger: { kind: 'doubleTap' } })).toStrictEqual(
      err({ path: 'trigger.kind', expected: '"holdCommand"' }),
    );
  });
});
