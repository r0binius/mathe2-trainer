import type { DeckId, Item } from '@/domain/content/types';

/** What each deck is called. */
export const deckTitles: Readonly<Record<DeckId, string>> = {
  definitions: 'Definitionen',
  theorems: 'Sätze und Formeln',
  claims: 'Wahr oder falsch',
  problems: 'Aufgaben',
};

/** What each kind of item is called. */
export const kindLabels: Readonly<Record<Item['kind'], string>> = {
  definition: 'Definition',
  theorem: 'Satz',
  claim: 'Wahr oder falsch?',
  problem: 'Aufgabe',
};

/** What a statement being tested asks for. */
export const kindPrompts: Readonly<Record<'definition' | 'theorem', string>> = {
  definition: 'Wie lautet die Definition?',
  theorem: 'Wie lautet die Aussage – mit allen Voraussetzungen?',
};

/** A day relative to today in words: 0 is today, 1 tomorrow, anything else "in n Tagen". */
export function inDays(days: number): string {
  if (days <= 0) {
    return 'heute';
  }

  return days === 1 ? 'morgen' : `in ${String(days)} Tagen`;
}
