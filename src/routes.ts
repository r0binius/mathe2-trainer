import type { RouteLocationRaw } from 'vue-router';

import type { DeckId } from '@/domain/content/types';

/** The route to the overview, the page the trainer starts on. */
export function toOverview(): RouteLocationRaw {
  return { name: 'overview' };
}

/** The route to a topic's decks. */
export function toTopic(topicId: string): RouteLocationRaw {
  return { name: 'topic', params: { topicId } };
}

/** The route to a deck's items. */
export function toDeck(topicId: string, deckId: DeckId): RouteLocationRaw {
  return { name: 'deck', params: { topicId, deckId } };
}

/** The route to learning a deck. */
export function toLearn(topicId: string, deckId: DeckId): RouteLocationRaw {
  return { name: 'learn', params: { topicId, deckId } };
}

/** The route to reviewing what's due, of one topic or of all. */
export function toReview(topicId?: string): RouteLocationRaw {
  return topicId === undefined ? { name: 'reviewAll' } : { name: 'review', params: { topicId } };
}

/** The route to looking things up. */
export function toLookup(): RouteLocationRaw {
  return { name: 'lookup' };
}

/** The route to the mock exam. */
export function toExam(): RouteLocationRaw {
  return { name: 'exam' };
}

/** The route to the settings. */
export function toSettings(): RouteLocationRaw {
  return { name: 'settings' };
}
