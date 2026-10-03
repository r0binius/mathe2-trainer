import type { RouteLocationNormalized, Router } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import { findDeck, findTopic } from '@/domain/content/lookup';
import type { Topic } from '@/domain/content/types';

import ExamScreen from './features/exam/ExamScreen.vue';
import DeckScreen from './features/library/DeckScreen.vue';
import OverviewScreen from './features/library/OverviewScreen.vue';
import TopicScreen from './features/library/TopicScreen.vue';
import LookupScreen from './features/lookup/LookupScreen.vue';
import LearnScreen from './features/practice/LearnScreen.vue';
import ReviewScreen from './features/practice/ReviewScreen.vue';
import SettingsScreen from './features/settings/SettingsScreen.vue';
import { toOverview } from './routes';

/** A single route parameter; a repeated one, which none of our routes has, reads as empty. */
function paramOf(route: RouteLocationNormalized, name: string): string {
  const value = route.params[name];

  return typeof value === 'string' ? value : '';
}

/**
 * The trainer's router. A route's IDs are looked up before its page opens: the page gets the topic
 * and deck as props, and a route to one that doesn't exist goes to the overview instead.
 */
export function createAppRouter(topics: readonly Topic[]): Router {
  function topicOf(route: RouteLocationNormalized): { readonly topic: Topic } | undefined {
    const topic = findTopic(topics, paramOf(route, 'topicId'));

    return topic && { topic };
  }

  function deckOf(route: RouteLocationNormalized): object | undefined {
    const found = topicOf(route);
    const deck = found && findDeck(found.topic, paramOf(route, 'deckId'));

    return deck && { ...found, deck };
  }

  function lookedUp(find: (route: RouteLocationNormalized) => object | undefined) {
    return {
      beforeEnter: (to: RouteLocationNormalized) => (find(to) === undefined ? toOverview() : true),
      props: (to: RouteLocationNormalized) => ({ ...find(to) }),
    };
  }

  return createRouter({
    history: createWebHashHistory(),
    scrollBehavior: () => ({ top: 0 }),
    routes: [
      { path: '/', name: 'overview', component: OverviewScreen, props: { topics } },
      { path: '/review', name: 'reviewAll', component: ReviewScreen, props: { topics } },
      { path: '/lookup', name: 'lookup', component: LookupScreen, props: { topics } },
      { path: '/exam', name: 'exam', component: ExamScreen, props: { topics } },
      { path: '/settings', name: 'settings', component: SettingsScreen },
      { path: '/topics/:topicId', name: 'topic', component: TopicScreen, ...lookedUp(topicOf) },
      {
        path: '/topics/:topicId/review',
        name: 'review',
        component: ReviewScreen,
        beforeEnter: (to) => (topicOf(to) === undefined ? toOverview() : true),
        props: (to) => ({ topics, ...topicOf(to) }),
      },
      {
        path: '/topics/:topicId/decks/:deckId',
        name: 'deck',
        component: DeckScreen,
        ...lookedUp(deckOf),
      },
      {
        path: '/topics/:topicId/decks/:deckId/learn',
        name: 'learn',
        component: LearnScreen,
        ...lookedUp(deckOf),
      },
      { path: '/:unknown(.*)*', redirect: toOverview() },
    ],
  });
}
