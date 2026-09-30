import type { Component } from 'vue';
import type {
  NavigationGuardWithThis,
  RouteLocationNormalized,
  Router,
  RouteRecordRaw,
} from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import { findApp, findSet } from '@/domain/shortcuts/lookup';
import type { AppDefinition } from '@/domain/shortcuts/types';

import AppScreen from './features/library/AppScreen.vue';
import SetScreen from './features/library/SetScreen.vue';
import StartScreen from './features/library/StartScreen.vue';
import LearnScreen from './features/practice/LearnScreen.vue';
import ReviewScreen from './features/practice/ReviewScreen.vue';
import type { RouteName } from './routes';
import { routePaths, toLibrary } from './routes';

/** How a screen gets its props: fixed ones, or a lookup of the route's IDs guarding it. */
type ScreenProps =
  | { readonly props: object }
  | {
      readonly beforeEnter: NavigationGuardWithThis<undefined>;
      readonly props: (route: RouteLocationNormalized) => object;
    };

/**
 * The main window's router, which picks the page the detail shows. A route's IDs are looked up in
 * `apps` before its page opens: the page gets the app and set as props, and a route to one that
 * doesn't exist, such as a hash route left over from older data, goes to the start page instead.
 */
export function createAppRouter(apps: readonly AppDefinition[]): Router {
  function appOf(route: RouteLocationNormalized) {
    const app = findApp(apps, paramOf(route, 'appId'));

    return app && { app };
  }

  function setOf(route: RouteLocationNormalized) {
    return findSet(apps, paramOf(route, 'appId'), paramOf(route, 'setId'));
  }

  return createRouter({
    history: createWebHashHistory(),
    routes: [
      screen('library', StartScreen, { props: { apps } }),
      screen('app', AppScreen, lookedUp(appOf)),
      screen('review', ReviewScreen, lookedUp(appOf)),
      screen('set', SetScreen, lookedUp(setOf)),
      screen('learn', LearnScreen, lookedUp(setOf)),
      { path: '/:unknown(.*)*', redirect: toLibrary() },
    ],
  });
}

/** A screen's route, at its path from `routes.ts`. */
function screen(name: RouteName, component: Component, props: ScreenProps): RouteRecordRaw {
  return { path: routePaths[name], name, component, ...props };
}

/**
 * Guards a route by a lookup of its IDs: the screen gets what was found as its props, and a
 * route to something that doesn't exist goes to the library. vue-router doesn't check `props`
 * against the screen's props, so the guard is what makes them safe.
 */
function lookedUp(find: (route: RouteLocationNormalized) => object | undefined): ScreenProps {
  return {
    beforeEnter: (to) => (find(to) === undefined ? toLibrary() : true),
    props: (to) => ({ ...find(to) }),
  };
}

/** A single route parameter; a repeated one, which none of our routes has, reads as empty. */
function paramOf(route: RouteLocationNormalized, name: string): string {
  const value = route.params[name];

  return typeof value === 'string' ? value : '';
}
