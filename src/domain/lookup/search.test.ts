import { describe, expect, it } from 'vitest';

import type { SearchGroup } from './search';
import { searchGroups } from './search';

const file: SearchGroup<string> = {
  title: 'Ablage',
  items: ['Neues Fenster', 'Öffnen', 'Fenster schließen'],
};
const view: SearchGroup<string> = { title: 'Darstellung', items: ['Vergrößern', 'Originalgröße'] };
const groups = [file, view];

function search(query: string): readonly SearchGroup<string>[] {
  return searchGroups(groups, query, (item) => item);
}

describe('searchGroups', () => {
  it('keeps everything for an empty query', () => {
    expect(search('  ')).toStrictEqual(groups);
  });

  it('keeps the items whose title contains the query, ignoring case', () => {
    expect(search('fenster')).toStrictEqual([
      { title: 'Ablage', items: ['Neues Fenster', 'Fenster schließen'] },
    ]);
  });

  it('ignores accents, so a plain keyboard finds them', () => {
    expect(search('offnen')).toStrictEqual([{ title: 'Ablage', items: ['Öffnen'] }]);
    expect(search('groß')).toStrictEqual([view]);
  });

  it('needs every word, in any order', () => {
    expect(search('schließen fenster')).toStrictEqual([
      { title: 'Ablage', items: ['Fenster schließen'] },
    ]);
  });

  it('finds words in the group title too', () => {
    expect(search('ablage öffnen')).toStrictEqual([{ title: 'Ablage', items: ['Öffnen'] }]);
    expect(search('darstellung')).toStrictEqual([view]);
  });

  it('leaves out groups without a match', () => {
    expect(search('drucken')).toStrictEqual([]);
  });
});
