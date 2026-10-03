import type { Decoder } from './decode';
import { literal, oneOf } from './decode';

/**
 * Whether the user allows something macOS guards, such as reading other apps' menus
 * (Accessibility) or watching clicks and key presses (Input Monitoring).
 */
export type Access = 'granted' | 'denied';

/** Decodes an {@link Access}, as the Rust side sends it. */
export const decodeAccess: Decoder<Access> = oneOf([literal('granted'), literal('denied')]);
