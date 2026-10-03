import type { Permission } from '@/domain/settings/coachAccess';
import { decodeCoachAccess } from '@/domain/settings/coachAccess';
import type { Decoder } from '@/domain/shared/decode';
import { decodeBanner } from '@/domain/usage/banner';
import { decodeMenuChoice } from '@/domain/usage/menuChoice';
import type { Coach, Logger } from '@/ports';

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

/**
 * The coach on the Rust side. If listening for menu choices or banners fails, or what arrives
 * doesn't decode, `logger` says why.
 */
export function coach(invoke: Invoke, listen: Listen, logger: Logger): Coach {
  const call = commandCaller(invoke);

  function reportFor(event: string): (message: string) => void {
    return (message) => {
      logger.error(`Could not follow ${event}: ${message}`);
    };
  }

  function follow<T>(event: string, decoder: Decoder<T>) {
    return decodingPayloads(subscriber(listen, event, reportFor(event)), decoder, reportFor(event));
  }

  return {
    load: () => call('get_coach_access', decodeCoachAccess),
    askFor: (permission) => call(askCommands[permission], nothing),
    onMenuChosen: follow(menuChosen, decodeMenuChoice),
    showBanner: (banner) => call('show_banner', nothing, { banner }),
    onBannerShown: follow(bannerShown, decodeBanner),
  };
}
