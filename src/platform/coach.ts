import type { Permission } from '@/domain/settings/coachAccess';
import { decodeCoachAccess } from '@/domain/settings/coachAccess';
import type { Decoder } from '@/domain/shared/decode';
import { decodeBanner } from '@/domain/usage/banner';
import { decodeMenuChoice } from '@/domain/usage/menuChoice';
import { decodeKeyUsed } from '@/domain/usage/watched';
import type { Banners, Coach, CoachPermissions, Logger } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller, decodingPayloads, nothing, subscriber } from './ipc';

/** The command that opens System Settings where the user allows each permission. */
const askCommands: Readonly<Record<Permission, string>> = {
  menus: 'ask_for_menu_access',
  input: 'ask_for_input_access',
};

/** The event the Rust side sends the main window for every menu choice it sees. */
const menuChosen = 'menu-chosen';

/** The event the Rust side sends the banner with what to show. */
const bannerShown = 'banner-shown';

/** The event the Rust side sends the main window for every press of a watched shortcut. */
const keyUsed = 'key-used';

/** Follows an event of the Rust side with its decoded payload; `logger` says why it can't. */
function following(listen: Listen, logger: Logger) {
  return function follow<T>(event: string, decoder: Decoder<T>) {
    function report(message: string): void {
      logger.error(`Could not follow ${event}: ${message}`);
    }

    return decodingPayloads(subscriber(listen, event, report), decoder, report);
  };
}

/** What learning from how the user works needs the user to allow, asked of the Rust side. */
export function coachPermissions(invoke: Invoke): CoachPermissions {
  const call = commandCaller(invoke);

  return {
    load: () => call('get_coach_access', decodeCoachAccess),
    askFor: (permission) => call(askCommands[permission], nothing),
  };
}

/**
 * The coach on the Rust side. If listening for menu choices or key presses fails, or what arrives
 * doesn't decode, `logger` says why.
 */
export function coach(invoke: Invoke, listen: Listen, logger: Logger): Coach {
  const call = commandCaller(invoke);
  const follow = following(listen, logger);

  return {
    onMenuChosen: follow(menuChosen, decodeMenuChoice),
    showBanner: (banner) => call('show_banner', nothing, { banner }),
    setWatched: (shortcuts) => call('set_watched_shortcuts', nothing, { shortcuts }),
    onKeyUsed: (listener) =>
      follow(
        keyUsed,
        decodeKeyUsed,
      )(({ id }) => {
        listener(id);
      }),
  };
}

/** The banners the Rust side tells the banner window to show. */
export function banners(listen: Listen, logger: Logger): Banners {
  return { onShown: following(listen, logger)(bannerShown, decodeBanner) };
}
