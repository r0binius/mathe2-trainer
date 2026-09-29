import { error, warn } from '@tauri-apps/plugin-log';

import type { Logger } from '@/ports';

/**
 * Logs through Rust into the app's log file (in `~/Library/Logs`) and, during development, the
 * terminal. Logging never fails the caller: a message that can't be written is dropped.
 */
export const tauriLogger: Logger = {
  warn: (message) => {
    void warn(message).catch(() => undefined);
  },
  error: (message) => {
    void error(message).catch(() => undefined);
  },
};
