/** Items under a title, such as the shortcuts in one menu or set. */
export type SearchGroup<T> = {
  readonly title: string;
  readonly items: readonly T[];
};

/** Combining marks, which `normalize('NFD')` splits off a letter: the dots of `ö`. */
const combiningMarks = /\p{M}/gu;

/** Text as search compares it: lowercase, without accents. */
function fold(text: string): string {
  return text.normalize('NFD').replace(combiningMarks, '').toLowerCase();
}

function wordsOf(query: string): readonly string[] {
  return fold(query)
    .split(/\s+/u)
    .filter((word) => word !== '');
}

/**
 * The groups and items that match `query`: every word of it must appear in the item's title or
 * its group's title, ignoring case and accents. Groups left without items are dropped, and an
 * empty query keeps everything.
 * @example
 * ```ts
 * searchGroups([{ title: 'Ablage', items: ['Öffnen'] }], 'ablage offnen', (item) => item);
 * // [{ title: 'Ablage', items: ['Öffnen'] }]
 * ```
 */
export function searchGroups<T>(
  groups: readonly SearchGroup<T>[],
  query: string,
  titleOf: (item: T) => string,
): readonly SearchGroup<T>[] {
  const words = wordsOf(query);

  if (words.length === 0) {
    return groups;
  }

  return groups
    .map((group) => ({
      title: group.title,
      items: group.items.filter((item) => containsAll(`${group.title} ${titleOf(item)}`, words)),
    }))
    .filter((group) => group.items.length > 0);
}

function containsAll(text: string, words: readonly string[]): boolean {
  const folded = fold(text);

  return words.every((word) => folded.includes(word));
}
