import type { Access } from '../shared/access';
import { decodeAccess } from '../shared/access';
import type { Decoder } from '../shared/decode';
import { object } from '../shared/decode';

/**
 * What learning from how the user works needs them to allow: Accessibility to see which menu item
 * they choose (`menus`), and Input Monitoring to see their clicks and key presses (`input`).
 */
export type CoachAccess = {
  readonly menus: Access;
  readonly input: Access;
};

/** One of the permissions in {@link CoachAccess}. */
export type Permission = keyof CoachAccess;

/** Decodes the answer of `get_coach_access`. */
export const decodeCoachAccess: Decoder<CoachAccess> = object({
  menus: decodeAccess,
  input: decodeAccess,
});

/** The permissions still denied, in the order the Settings window asks for them. */
export function missingPermissions(access: CoachAccess): readonly Permission[] {
  const permissions: readonly Permission[] = ['menus', 'input'];

  return permissions.filter((permission) => access[permission] === 'denied');
}
