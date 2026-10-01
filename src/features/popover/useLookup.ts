import type { ShallowRef } from 'vue';
import { onScopeDispose } from 'vue';

import { useProgram } from '@/composables/useProgram';
import type { Lookup, LookupEffect, LookupMsg } from '@/domain/lookup/lookup';
import { initialLookup, updateLookup } from '@/domain/lookup/lookup';
import type { AppDefinition } from '@/domain/shortcuts/types';
import type { Logger, Lookup as LookupPort } from '@/ports';

/**
 * Runs the popover's lookup for as long as the calling component lives: every opening of the
 * popover becomes a message, and the program's effects go to the Rust side through `port`.
 * Returns the lookup to render, and how to send it messages.
 */
export function useLookup(
  apps: readonly AppDefinition[],
  port: LookupPort,
  logger: Logger,
): readonly [lookup: Readonly<ShallowRef<Lookup>>, dispatch: (msg: LookupMsg) => void] {
  async function run(effect: LookupEffect, dispatch: (msg: LookupMsg) => void): Promise<void> {
    switch (effect.type) {
      case 'readMenus': {
        const result = await port.readMenuShortcuts();

        if (result.kind === 'err') {
          logger.error(`Could not read the menus: ${result.error.message}`);
        }
        dispatch({ type: 'menusRead', opening: effect.opening, result });
        return;
      }
      case 'askForAccess': {
        const asked = await port.askForMenuAccess();

        if (asked.kind === 'err') {
          logger.error(`Could not ask for access to the menus: ${asked.error.message}`);
        }
        return;
      }
    }
  }

  const [lookup, dispatch] = useProgram<Lookup, LookupMsg, LookupEffect>(initialLookup, {
    update: (model, msg) => updateLookup(apps, model, msg),
    run: (effect, send) => {
      void run(effect, send);
    },
  });

  onScopeDispose(
    port.onPopoverOpened((opened) => {
      dispatch({ type: 'opened', opened });
    }),
  );

  return [lookup, dispatch];
}
