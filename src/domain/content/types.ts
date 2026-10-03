/**
 * Identifies one thing to learn across the whole trainer, such as `folgen/def/cauchy-folge`: its
 * topic, its deck and its own name. Progress is stored under it, so it never changes once
 * published.
 */
export type ItemId = string;

/**
 * Text with mathematics: paragraphs separated by blank lines, `- ` list items, `**bold**`, and
 * TeX between `$…$` (inline) or `$$…$$` (displayed).
 */
export type RichText = string;

/** A definition or a theorem to know by heart: its name is asked, its statement recalled. */
export type Statement = {
  readonly kind: 'definition' | 'theorem';
  readonly id: ItemId;
  /** What it's called, such as "Cauchy-Folge" or "Satz von Bolzano-Weierstraß". */
  readonly title: string;
  /** The statement as the lecture notes give it. */
  readonly statement: RichText;
  /** What helps to remember or apply it: an intuition, a typical trap, a counterexample. */
  readonly note?: RichText;
  /** Where the lecture notes state it, such as "Definition 193". */
  readonly ref?: string;
};

/** A claim to judge as true or false, which tests whether a statement was understood. */
export type Claim = {
  readonly kind: 'claim';
  readonly id: ItemId;
  readonly statement: RichText;
  readonly holds: boolean;
  /** Why it holds, or a counterexample. */
  readonly reason: RichText;
  readonly ref?: string;
};

/** An exam-style problem with a worked solution. */
export type Problem = {
  readonly kind: 'problem';
  readonly id: ItemId;
  readonly title: string;
  readonly task: RichText;
  /** A nudge towards the solution, shown on request. */
  readonly hint?: RichText;
  readonly solution: RichText;
  /** What the problem is worth in a mock exam. */
  readonly points: number;
  /** The exercise sheet it comes from or follows, such as "Blatt 1, Aufgabe 7". */
  readonly source?: string;
};

/** Anything the trainer teaches. */
export type Item = Statement | Claim | Problem;

/** The four decks every topic has, in the order they're shown. */
export const deckIds = ['definitions', 'theorems', 'claims', 'problems'] as const;

/** One of the {@link deckIds}. */
export type DeckId = (typeof deckIds)[number];

/** The items of one kind within a topic, learned together. */
export type Deck = {
  readonly id: DeckId;
  readonly items: readonly Item[];
};

/** A chapter of the lecture, with everything to learn from it. */
export type Topic = {
  /** Unique, and the first part of every {@link ItemId} of the topic. */
  readonly id: string;
  /** The chapter of the lecture notes, such as "9.3". */
  readonly chapter: string;
  readonly title: string;
  /** One line on what the chapter is about. */
  readonly summary: string;
  readonly decks: readonly Deck[];
};

/** An item together with the topic and deck it belongs to. */
export type Located = {
  readonly item: Item;
  readonly topic: Topic;
  readonly deck: DeckId;
};
