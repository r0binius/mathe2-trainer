import { describe, expect, it } from 'vitest';

import { locateAll } from '@/domain/content/lookup';
import { renderRich } from '@/domain/content/rich';
import type { Item } from '@/domain/content/types';
import { renderTex } from '@/platform/math';

import { topics } from './topics';

const all = locateAll(topics);

function textsOf(item: Item): readonly string[] {
  switch (item.kind) {
    case 'definition':
    case 'theorem':
      return [item.statement, item.note ?? ''];
    case 'claim':
      return [item.statement, item.reason];
    case 'problem':
      return [item.task, item.hint ?? '', item.solution];
  }
}

describe('the topics', () => {
  it('give every item its own ID', () => {
    const ids = all.map(({ item }) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('have all four decks filled in every topic', () => {
    topics.forEach((topic) => {
      expect(topic.decks.map(({ id }) => id)).toEqual([
        'definitions',
        'theorems',
        'claims',
        'problems',
      ]);
      topic.decks.forEach((deck) => {
        expect(deck.items.length, `${topic.id}/${deck.id}`).toBeGreaterThan(0);
      });
    });
  });

  it('contain only formulas MathJax can read, with balanced dollar signs', () => {
    all.forEach(({ item }) => {
      textsOf(item).forEach((text) => {
        expect((text.match(/\$/g) ?? []).length % 2, `odd $ in ${item.id}`).toBe(0);

        const html = renderRich(text, renderTex);

        expect(html, `TeX error in ${item.id}`).not.toContain('data-mjx-error');
        expect(html, `unrendered TeX in ${item.id}`).not.toContain('<code>');
        expect(html, `stray $ in ${item.id}`).not.toContain('$');
      });
    });
  });
});
