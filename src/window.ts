import { createPinia } from 'pinia';
import type { App, Component } from 'vue';
import { createApp } from 'vue';

import { macosKeyLabels } from './domain/keyboard/labels';
import { uiLanguageOf } from './domain/settings/language';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriPorts } from './platform/tauri';
import { logPolicyViolations } from './policyViolations';
import {
  changesKey,
  coachPermissionsKey,
  keyLabelsKey,
  keymapSourceKey,
  loggerKey,
  lookupKey,
  progressRepositoryKey,
  settingsRepositoryKey,
  windowsKey,
} from './ports';

/**
 * A window's Vue app, set up as every window is: Pinia, the UI language of the system until the
 * settings are loaded, the ports backed by the Rust side, and a log of what the content security
 * policy blocks. Each entry adds what only it needs, such as the router, and mounts it.
 *
 * Every window gets every port: what a window may actually call is decided by its capability on
 * the Rust side, not by what it's given here.
 */
export function createWindow(root: Component, rootProps?: Readonly<Record<string, unknown>>): App {
  const ports = tauriPorts();

  logPolicyViolations(tauriLogger);

  return createApp(root, rootProps)
    .use(createPinia())
    .use(createAppI18n(uiLanguageOf(navigator.languages)))
    .provide(settingsRepositoryKey, ports.settings)
    .provide(progressRepositoryKey, ports.progress)
    .provide(keymapSourceKey, ports.keymap)
    .provide(changesKey, ports.changes)
    .provide(windowsKey, ports.windows)
    .provide(lookupKey, ports.lookup)
    .provide(coachPermissionsKey, ports.coach)
    .provide(keyLabelsKey, macosKeyLabels)
    .provide(loggerKey, tauriLogger);
}
