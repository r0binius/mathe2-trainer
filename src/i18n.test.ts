import { describe, expect, expectTypeOf, it } from 'vitest';

import type { UiKey } from './i18n';
import de from './locales/de.json';
import en from './locales/en.json';

/** Every dotted path to a text in a message tree. */
function pathsOf(messages: Readonly<Record<string, unknown>>, prefix = ''): readonly string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    isTree(value) ? pathsOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

function isTree(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

describe('UI text', () => {
  it('has the same texts in German as in English', () => {
    expect(pathsOf(de)).toStrictEqual(pathsOf(en));
  });

  it('types keys as the paths of the English texts', () => {
    expectTypeOf<'library.recent'>().toExtend<UiKey>();
    expectTypeOf<'categories.music'>().toExtend<UiKey>();
    // A section isn't a text, and a misspelled key doesn't exist.
    expectTypeOf<'library'>().not.toExtend<UiKey>();
    expectTypeOf<'library.recnet'>().not.toExtend<UiKey>();
  });
});
