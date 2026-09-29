import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';

/** The main window's screens, by route name. */
export type RouteName = 'library' | 'app' | 'review' | 'set' | 'learn';

/** Where each screen lives. */
export const routePaths: Readonly<Record<RouteName, string>> = {
  library: '/',
  app: '/apps/:appId',
  review: '/apps/:appId/review',
  set: '/apps/:appId/sets/:setId',
  learn: '/apps/:appId/sets/:setId/learn',
};

/**
 * How deep each screen lies below the library, which decides the direction screens slide in:
 * deeper slides in from the right, back towards the library slides out to the right. A `Record`,
 * so a new screen can't be added without one.
 */
const routeDepths: Readonly<Record<RouteName, number>> = {
  library: 0,
  app: 1,
  review: 2,
  set: 2,
  learn: 3,
};

/** How deep a route lies below the library; an unknown one counts as the library. */
export function depthOf(route: Pick<RouteLocationNormalized, 'name'>): number {
  return isRouteName(route.name) ? routeDepths[route.name] : 0;
}

/** The route to the list of apps. */
export function toLibrary(): RouteLocationRaw {
  return { name: 'library' };
}

/** The route to an app's sets. */
export function toApp(appId: string): RouteLocationRaw {
  return { name: 'app', params: { appId } };
}

/** The route to reviewing an app's due shortcuts. */
export function toReview(appId: string): RouteLocationRaw {
  return { name: 'review', params: { appId } };
}

/** The route to a set's shortcuts. */
export function toSet(appId: string, setId: string): RouteLocationRaw {
  return { name: 'set', params: { appId, setId } };
}

/** The route to learning a set. */
export function toLearn(appId: string, setId: string): RouteLocationRaw {
  return { name: 'learn', params: { appId, setId } };
}

function isRouteName(name: RouteLocationNormalized['name']): name is RouteName {
  return typeof name === 'string' && Object.hasOwn(routeDepths, name);
}
