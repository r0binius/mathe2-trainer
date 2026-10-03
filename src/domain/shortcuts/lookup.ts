import type { AppDefinition, ShortcutSet } from './types';

/** A set, and the app it belongs to. */
export type AppSet = {
  readonly app: AppDefinition;
  readonly set: ShortcutSet;
};

/** The app with the given ID, or `undefined` if there's none, such as in an outdated route. */
export function findApp(apps: readonly AppDefinition[], appId: string): AppDefinition | undefined {
  return apps.find((app) => app.id === appId);
}

/**
 * The set with the given IDs, with its app, or `undefined` if either doesn't exist. An app's sets
 * are its own and those `runtimeSets` makes for it, such as Your commands.
 */
export function findSet(
  apps: readonly AppDefinition[],
  { appId, setId }: { readonly appId: string; readonly setId: string },
  runtimeSets: (app: AppDefinition) => readonly ShortcutSet[],
): AppSet | undefined {
  const app = findApp(apps, appId);
  const set = app && [...runtimeSets(app), ...app.sets].find(({ id }) => id === setId);

  return app === undefined || set === undefined ? undefined : { app, set };
}

/**
 * The app with built-in sets that has this bundle ID, which recognizes an app the system reports
 * rather than its name, which the system translates. `undefined` without a bundle ID, as for a
 * bare executable, or if Mouseless has no sets for it.
 */
export function findAppByBundleId(
  apps: readonly AppDefinition[],
  bundleId: string | undefined,
): AppDefinition | undefined {
  return bundleId === undefined ? undefined : apps.find((app) => app.bundleIds.includes(bundleId));
}
