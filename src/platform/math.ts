import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js';

import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { SVG } from 'mathjax-full/js/output/svg.js';

import { escapeHtml } from '@/domain/content/rich';

/** The number sets the lecture notes use, as short TeX commands. */
const macros = {
  N: String.raw`\mathbb{N}`,
  Z: String.raw`\mathbb{Z}`,
  Q: String.raw`\mathbb{Q}`,
  R: String.raw`\mathbb{R}`,
  C: String.raw`\mathbb{C}`,
  K: String.raw`\mathbb{K}`,
};

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

// Formulas become SVG paths, so no math fonts have to load: the page stays one self-contained file.
const output = new SVG({ fontCache: 'none' });
const document = mathjax.document('', {
  InputJax: new TeX({ packages: ['base', 'ams', 'newcommand', 'configmacros'], macros }),
  OutputJax: output,
});

const rendered = new Map<string, string>();

/**
 * Renders TeX as an SVG, once per formula: the same formula is shown many times, such as in the
 * list of a deck and again while practicing. A formula MathJax can't read is shown as its source.
 */
export function renderTex(tex: string, display: boolean): string {
  const key = `${display ? 'D' : 'I'}${tex}`;
  const cached = rendered.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const markup = convert(tex, display);
  // eslint-disable-next-line functional/immutable-data -- a cache, the one place formulas are remembered
  rendered.set(key, markup);

  return markup;
}

function convert(tex: string, display: boolean): string {
  try {
    return adaptor.outerHTML(document.convert(tex, { display }));
  } catch {
    return `<code>${escapeHtml(tex)}</code>`;
  }
}

/** The CSS MathJax's SVG output needs, to add to the page once. */
export function mathStyles(): string {
  return adaptor.textContent(output.styleSheet(document) as never);
}
