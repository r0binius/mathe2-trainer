import type { Changes, Logger } from '@/ports';

import type { Listen } from './ipc';
import { subscriber } from './ipc';

/** What the Rust side tells every window after one of them changed something. */
export function changes(listen: Listen, logger: Logger): Changes {
  function follow(event: string) {
    return subscriber(listen, event, (message) => {
      logger.error(`Could not follow ${event}: ${message}`);
    });
  }

  return {
    onSettingsChanged: follow('settings-changed'),
    onProgressReset: follow('progress-reset'),
  };
}
