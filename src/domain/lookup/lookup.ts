import type { PlatformError } from '../shared/platformError';
import type { Result } from '../shared/result';
import { findAppInFront } from '../shortcuts/lookup';
import type { AppDefinition } from '../shortcuts/types';
import type { AppInFront, PopoverOpened } from './appInFront';
import type { MenuGroup } from './menuShortcuts';

/** What the popover shows. */
export type LookupScreen =
  /** It hasn't opened yet. */
  | { readonly kind: 'waiting' }
  /** It opened, but no other app has a window. */
  | { readonly kind: 'noApp' }
  /** The app in front has built-in sets, which are shown instead of its menus. */
  | { readonly kind: 'builtIn'; readonly app: AppDefinition }
  /** The app's menus can only be read once the user allows it. */
  | { readonly kind: 'needsAccess'; readonly app: AppInFront }
  | { readonly kind: 'loading'; readonly app: AppInFront }
  | { readonly kind: 'loaded'; readonly app: AppInFront; readonly groups: readonly MenuGroup[] }
  /** The app's menus couldn't be read, such as when it didn't answer in time. */
  | { readonly kind: 'failed'; readonly app: AppInFront };

/** The popover's lookup (the Elm model). */
export type Lookup = {
  /**
   * How often the popover has opened. A reading of the menus carries the number of its opening,
   * so one that comes back after the popover opened again is dropped.
   */
  readonly openings: number;
  /** What's typed in the search field. */
  readonly query: string;
  readonly screen: LookupScreen;
};

/** The lookup before the popover first opens. */
export const initialLookup: Lookup = { openings: 0, query: '', screen: { kind: 'waiting' } };

/** What happened, as a message to the lookup. */
export type LookupMsg =
  | { readonly type: 'opened'; readonly opened: PopoverOpened }
  | {
      readonly type: 'menusRead';
      /** The opening the menus were read for, as its `readMenus` effect named it. */
      readonly opening: number;
      readonly result: Result<readonly MenuGroup[], PlatformError>;
    }
  | { readonly type: 'searched'; readonly query: string }
  | { readonly type: 'accessAsked' };

/** Work for the shell. */
export type LookupEffect =
  { readonly type: 'readMenus'; readonly opening: number } | { readonly type: 'askForAccess' };

/** The lookup after a message, and the effects the shell has to carry out because of it. */
export type LookupUpdate = {
  readonly model: Lookup;
  readonly effects: readonly LookupEffect[];
};

/**
 * Applies a message to the lookup (Elm's `update`). The popover shows an app's built-in sets
 * rather than its menus, so it reads menus, or asks for access to them, only for other apps.
 * @see §10 of `docs/legacy-architecture.md` for the lookup this replaces
 */
export function updateLookup(
  apps: readonly AppDefinition[],
  lookup: Lookup,
  msg: LookupMsg,
): LookupUpdate {
  switch (msg.type) {
    case 'opened':
      return open(apps, lookup.openings + 1, msg.opened);
    case 'menusRead':
      return lookup.screen.kind === 'loading' && msg.opening === lookup.openings
        ? { model: { ...lookup, screen: read(lookup.screen.app, msg.result) }, effects: [] }
        : { model: lookup, effects: [] };
    case 'searched':
      return { model: { ...lookup, query: msg.query }, effects: [] };
    case 'accessAsked':
      return { model: lookup, effects: [{ type: 'askForAccess' }] };
  }
}

/** The popover opened, as opening number `opening`: it starts over, with an empty search. */
function open(
  apps: readonly AppDefinition[],
  opening: number,
  { app, menuAccess }: PopoverOpened,
): LookupUpdate {
  if (app === undefined) {
    return reopened(opening, { kind: 'noApp' });
  }

  const builtIn = findAppInFront(apps, app);

  if (builtIn !== undefined) {
    return reopened(opening, { kind: 'builtIn', app: builtIn });
  }

  return menuAccess === 'granted'
    ? reopened(opening, { kind: 'loading', app }, [{ type: 'readMenus', opening }])
    : reopened(opening, { kind: 'needsAccess', app });
}

function reopened(
  opening: number,
  screen: LookupScreen,
  effects: readonly LookupEffect[] = [],
): LookupUpdate {
  return { model: { openings: opening, query: '', screen }, effects };
}

function read(app: AppInFront, result: Result<readonly MenuGroup[], PlatformError>): LookupScreen {
  return result.kind === 'ok'
    ? { kind: 'loaded', app, groups: result.value }
    : { kind: 'failed', app };
}
