import { describe, expect, it } from 'vitest';

import { ok } from '../shared/result';
import { decodePopoverOpened } from './appInFront';

describe('decodePopoverOpened', () => {
  it('decodes the app in front and the access to its menus, as Rust sends them', () => {
    const opened = {
      app: { name: 'Notizen', bundleId: 'com.apple.Notes' },
      menuAccess: 'granted',
    };

    expect(decodePopoverOpened(opened)).toStrictEqual(ok(opened));
  });

  it('decodes an app without a bundle ID', () => {
    const opened = { app: { name: 'tool' }, menuAccess: 'denied' };

    expect(decodePopoverOpened(opened)).toStrictEqual(ok(opened));
  });

  it('decodes a popover opened over no other app', () => {
    expect(decodePopoverOpened({ menuAccess: 'denied' })).toStrictEqual(
      ok({ menuAccess: 'denied' }),
    );
  });

  it('rejects an unknown access', () => {
    expect(decodePopoverOpened({ menuAccess: 'asked' }).kind).toBe('err');
  });
});
