import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import { coachPermissions } from './coach';

describe('coachPermissions', () => {
  it('loads what is allowed with get_coach_access', async () => {
    const access = { menus: 'granted', input: 'denied' };
    const invoke = vi.fn(() => Promise.resolve(access));

    await expect(coachPermissions(invoke).load()).resolves.toStrictEqual(ok(access));
    expect(invoke).toHaveBeenCalledWith('get_coach_access', undefined);
  });

  it.each([
    ['menus', 'ask_for_menu_access'],
    ['input', 'ask_for_input_access'],
  ] as const)('asks for %s with %s', async (permission, command) => {
    const invoke = vi.fn(() => Promise.resolve(null));

    await expect(coachPermissions(invoke).askFor(permission)).resolves.toStrictEqual(ok(undefined));
    expect(invoke).toHaveBeenCalledWith(command, undefined);
  });
});
