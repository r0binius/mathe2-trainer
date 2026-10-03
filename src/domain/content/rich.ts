import type { RichText } from './types';

/** Turns TeX into markup to show, inline or as a displayed formula. The shell provides it. */
export type TexRenderer = (tex: string, display: boolean) => string;

/** Displayed math, then inline math; whichever comes first in the text matches. */
const mathPattern = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;

/**
 * Renders {@link RichText} as HTML: paragraphs, lists, bold text and formulas. Everything that
 * isn't a formula is escaped, so text from outside, such as a tutor's answer, can't inject markup.
 */
export function renderRich(source: RichText, tex: TexRenderer): string {
  return source
    .trim()
    .split(/\n\s*\n/)
    .map((block) => renderBlock(block.trim(), tex))
    .join('');
}

function renderBlock(block: string, tex: TexRenderer): string {
  const lines = block.split('\n').map((line) => line.trim());

  return lines[0]?.startsWith('- ') === true
    ? `<ul>${listItems(lines)
        .map((item) => `<li>${renderInline(item, tex)}</li>`)
        .join('')}</ul>`
    : `<p>${lines.map((line) => renderInline(line, tex)).join('<br>')}</p>`;
}

/** A list's items: a line that doesn't start one continues the item before it. */
function listItems(lines: readonly string[]): readonly string[] {
  return lines.reduce<readonly string[]>(
    (items, line) =>
      line.startsWith('- ')
        ? [...items, line.slice(2)]
        : [...items.slice(0, -1), `${items.at(-1) ?? ''} ${line}`],
    [],
  );
}

/** A line's text and formulas in order: the text between two formulas, then the formula. */
function renderInline(line: string, tex: TexRenderer): string {
  const formulas = [...line.matchAll(mathPattern)];
  const starts = formulas.map((match) => match.index);
  const ends = formulas.map((match) => match.index + match[0].length);

  const parts = formulas.map((match, index) => {
    const before = line.slice(index === 0 ? 0 : ends[index - 1], starts[index]);
    const [, displayed, inline] = match;

    return escapeHtml(before) + renderFormula(displayed, inline, tex);
  });

  // Bold is marked last, on the finished line, so it may span formulas.
  return (parts.join('') + escapeHtml(line.slice(ends.at(-1) ?? 0))).replace(
    /\*\*(.+?)\*\*/g,
    '<strong>$1</strong>',
  );
}

function renderFormula(
  displayed: string | undefined,
  inline: string | undefined,
  tex: TexRenderer,
): string {
  return displayed === undefined ? tex(inline ?? '', false) : tex(displayed, true);
}

/** Escapes what HTML would read as markup. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** A rich text without its formulas' dollar signs and bold marks, for places that show plain text. */
export function plainText(source: RichText): string {
  return source.replaceAll('$', '').replaceAll('**', '').replace(/\s+/g, ' ').trim();
}
