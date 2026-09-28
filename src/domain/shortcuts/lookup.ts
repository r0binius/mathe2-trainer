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

/** The set with the given IDs, with its app, or `undefined` if either doesn't exist. */
export function findSet(
  apps: readonly AppDefinition[],
  appId: string,
  setId: string,
): AppSet | undefined {
  const app = findApp(apps, appId);
  const set = app?.sets.find(({ id }) => id === setId);

  return app === undefined || set === undefined ? undefined : { app, set };
}
