import { describe, expect, it } from 'vitest';

import { macosReserved } from '../keyboard/policy';
import { err, ok } from '../shared/result';
import { decodeSettings, reservedFor } from './settings';

const defaults = {
  trigger: { kind: 'holdCommand' },
  showMenuBarIcon: true,
  showDockIcon: true,
  language: 'system',
  learnFromWork: false,
  showMenuBanner: true,
};

describe('decodeSettings', () => {
  it('decodes the settings, as Rust sends them', () => {
    expect(decodeSettings(defaults)).toStrictEqual(ok(defaults));
  });

  it('decodes a shortcut as the trigger', () => {
    const settings = { ...defaults, trigger: { kind: 'shortcut', keys: ['Shift', 'Meta', 'm'] } };

    expect(decodeSettings(settings)).toStrictEqual(ok(settings));
  });

  it('decodes a chosen language', () => {
    expect(decodeSettings({ ...defaults, language: 'de' })).toStrictEqual(
      ok({ ...defaults, language: 'de' }),
    );
  });

  it('decodes learning from work turned on', () => {
    expect(decodeSettings({ ...defaults, learnFromWork: true })).toStrictEqual(
      ok({ ...defaults, learnFromWork: true }),
    );
  });

  it('rejects settings without learning from work, which Rust always sends', () => {
    const { trigger, showMenuBarIcon, showDockIcon, language } = defaults;

    expect(decodeSettings({ trigger, showMenuBarIcon, showDockIcon, language }).kind).toBe('err');
  });

  it('rejects an unknown trigger', () => {
    expect(decodeSettings({ ...defaults, trigger: { kind: 'doubleTap' } })).toStrictEqual(
      err({ path: 'trigger.kind', expected: '"holdCommand"' }),
    );
  });
});

describe('reservedFor', () => {
  it('reserves only what macOS handles itself while ⌘ is held to open the popover', () => {
    expect(reservedFor({ kind: 'holdCommand' })).toStrictEqual(macosReserved);
  });

  it("also reserves the popover's shortcut, which the app catches before practice can", () => {
    const keys = ['Shift', 'Meta', 'm'];

    expect(reservedFor({ kind: 'shortcut', keys })).toStrictEqual([...macosReserved, keys]);
  });
});
