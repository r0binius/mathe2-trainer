import type { RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import { findApp, findSet } from '@/domain/shortcuts/lookup';
import type { AppDefinition } from '@/domain/shortcuts/types';

import AppScreen from './features/library/AppScreen.vue';
import LibraryScreen from './features/library/LibraryScreen.vue';
import SetScreen from './features/library/SetScreen.vue';
import LearnScreen from './features/practice/LearnScreen.vue';

/** The route to the list of apps. */
export function toLibrary(): RouteLocationRaw {
  return { name: 'library' };
}

/** The route to an app's sets. */
export function toApp(appId: string): RouteLocationRaw {
  return { name: 'app', params: { appId } };
}

/** The route to a set's shortcuts. */
export function toSet(appId: string, setId: string): RouteLocationRaw {
  return { name: 'set', params: { appId, setId } };
}

/** The route to learning a set. */
export function toLearn(appId: string, setId: string): RouteLocationRaw {
  return { name: 'learn', params: { appId, setId } };
}

/**
 * The main window's router. A route's IDs are looked up in `apps` before its screen opens: the
 * screen gets the app and set as props, and a route to one that doesn't exist, such as a hash
 * route left over from older data, goes to the library instead.
 */
export function createAppRouter(apps: readonly AppDefinition[]): Router {
  function appOf(route: RouteLocationNormalized) {
    return findApp(apps, paramOf(route, 'appId'));
  }

  function setOf(route: RouteLocationNormalized) {
    return findSet(apps, paramOf(route, 'appId'), paramOf(route, 'setId'));
  }

  return createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/',
        name: 'library',
        component: LibraryScreen,
        props: { apps },
        meta: { depth: 0 },
      },
      {
        path: '/apps/:appId',
        name: 'app',
        component: AppScreen,
        meta: { depth: 1 },
        beforeEnter: (to) => (appOf(to) === undefined ? toLibrary() : true),
        props: (to) => ({ app: appOf(to) }),
      },
      {
        path: '/apps/:appId/sets/:setId',
        name: 'set',
        component: SetScreen,
        meta: { depth: 2 },
        beforeEnter: (to) => (setOf(to) === undefined ? toLibrary() : true),
        props: (to) => ({ ...setOf(to) }),
      },
      {
        path: '/apps/:appId/sets/:setId/learn',
        name: 'learn',
        component: LearnScreen,
        meta: { depth: 3 },
        beforeEnter: (to) => (setOf(to) === undefined ? toLibrary() : true),
        props: (to) => ({ ...setOf(to) }),
      },
      { path: '/:unknown(.*)*', redirect: toLibrary() },
    ],
  });
}

/**
 * How deep a route lies below the library, which decides the direction screens slide in: deeper
 * slides in from the right, back towards the library slides out to the right.
 */
export function depthOf(route: RouteLocationNormalized): number {
  const { depth } = route.meta;

  return typeof depth === 'number' ? depth : 0;
}

/** A single route parameter; a repeated one, which none of our routes has, reads as empty. */
function paramOf(route: RouteLocationNormalized, name: string): string {
  const value = route.params[name];

  return typeof value === 'string' ? value : '';
}
