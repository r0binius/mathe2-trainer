import type { Deck, DeckId, Item, Located, Topic } from './types';

/** The topic with the given ID, if there is one. */
export function findTopic(topics: readonly Topic[], topicId: string): Topic | undefined {
  return topics.find(({ id }) => id === topicId);
}

/** A topic's deck with the given ID, if the topic has it. */
export function findDeck(topic: Topic, deckId: string): Deck | undefined {
  return topic.decks.find(({ id }) => id === deckId);
}

/** Every item of a topic, deck by deck. */
export function topicItems(topic: Topic): readonly Item[] {
  return topic.decks.flatMap(({ items }) => items);
}

/** Every item of every topic, each with where it belongs. */
export function locateAll(topics: readonly Topic[]): readonly Located[] {
  return topics.flatMap((topic) =>
    topic.decks.flatMap((deck) => deck.items.map((item) => ({ item, topic, deck: deck.id }))),
  );
}

/** The text an item is listed and searched by: its title, or the claim itself. */
export function headlineOf(item: Item): string {
  return item.kind === 'claim' ? item.statement : item.title;
}

/** Everything written on an item, for searching. */
function textOf(item: Item): string {
  switch (item.kind) {
    case 'definition':
    case 'theorem':
      return [item.title, item.statement, item.note, item.ref].join(' ');
    case 'claim':
      return [item.statement, item.reason, item.ref].join(' ');
    case 'problem':
      return [item.title, item.task, item.solution, item.source].join(' ');
  }
}

/** What narrows the items to look up: words to find, and the topic and deck to stay in. */
export type LookupFilter = {
  readonly query: string;
  readonly topicId: string | undefined;
  readonly deck: DeckId | undefined;
};

/**
 * The items matching a filter. Every word of the query has to occur somewhere in the item,
 * whatever its case, and items whose title has all of them come first.
 */
export function search(all: readonly Located[], filter: LookupFilter): readonly Located[] {
  const words = filter.query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const inScope = all.filter(
    ({ topic, deck }) =>
      (filter.topicId === undefined || topic.id === filter.topicId) &&
      (filter.deck === undefined || deck === filter.deck),
  );
  const matches = inScope.filter(({ item }) => hasAll(textOf(item), words));

  return words.length === 0
    ? matches
    : [
        ...matches.filter(({ item }) => hasAll(headlineOf(item), words)),
        ...matches.filter(({ item }) => !hasAll(headlineOf(item), words)),
      ];
}

function hasAll(text: string, words: readonly string[]): boolean {
  const lower = text.toLowerCase();

  return words.every((word) => lower.includes(word));
}
