import type { RouteLocationRaw } from 'vue-router';

/** The main window's pages, by route name. */
export type RouteName = 'library' | 'app' | 'review' | 'set' | 'learn';

/** Where each screen lives. */
export const routePaths: Readonly<Record<RouteName, string>> = {
  library: '/',
  app: '/apps/:appId',
  review: '/apps/:appId/review',
  set: '/apps/:appId/sets/:setId',
  learn: '/apps/:appId/sets/:setId/learn',
};

/** The route to the start page, where no app is selected. */
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
