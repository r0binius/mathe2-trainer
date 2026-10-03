import type { Claim, DeckId, Item, Problem, Statement, Topic } from './types';

/** An item as a topic file writes it: with a short name that's unique within its deck. */
type Draft<T extends Item> = Omit<T, 'id' | 'kind'> & { readonly id: string };

/** A topic as its file writes it, before its items get their kinds and full IDs. */
export type TopicDraft = {
  readonly id: string;
  readonly chapter: string;
  readonly title: string;
  readonly summary: string;
  readonly definitions: readonly Draft<Statement>[];
  readonly theorems: readonly Draft<Statement>[];
  readonly claims: readonly Draft<Claim>[];
  readonly problems: readonly Draft<Problem>[];
};

/** The part of an {@link ItemId} that names each deck. */
const deckSlugs: Readonly<Record<DeckId, string>> = {
  definitions: 'def',
  theorems: 'satz',
  claims: 'wf',
  problems: 'aufgabe',
};

/**
 * Builds a topic from its draft: every item gets its kind and its full ID, such as
 * `folgen/def/cauchy-folge`, so the topic files stay short.
 */
export function topic(draft: TopicDraft): Topic {
  function idOf(deck: DeckId, name: string): string {
    return `${draft.id}/${deckSlugs[deck]}/${name}`;
  }

  return {
    id: draft.id,
    chapter: draft.chapter,
    title: draft.title,
    summary: draft.summary,
    decks: [
      {
        id: 'definitions',
        items: draft.definitions.map((item) => ({
          ...item,
          kind: 'definition' as const,
          id: idOf('definitions', item.id),
        })),
      },
      {
        id: 'theorems',
        items: draft.theorems.map((item) => ({
          ...item,
          kind: 'theorem' as const,
          id: idOf('theorems', item.id),
        })),
      },
      {
        id: 'claims',
        items: draft.claims.map((item) => ({
          ...item,
          kind: 'claim' as const,
          id: idOf('claims', item.id),
        })),
      },
      {
        id: 'problems',
        items: draft.problems.map((item) => ({
          ...item,
          kind: 'problem' as const,
          id: idOf('problems', item.id),
        })),
      },
    ],
  };
}
