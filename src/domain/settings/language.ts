import type { Decoder } from '../shared/decode';
import { literal, oneOf } from '../shared/decode';

/** The languages the UI is written in. */
export const uiLanguages = ['en', 'de'] as const;

/** One of the {@link uiLanguages}. */
export type UiLanguage = (typeof uiLanguages)[number];

/** The language setting: one of the {@link uiLanguages}, or the system's. */
export type LanguageSetting = 'system' | UiLanguage;

/** Decodes the language setting. */
export const decodeLanguageSetting: Decoder<LanguageSetting> = oneOf([
  literal('system'),
  literal('en'),
  literal('de'),
]);

/** The language used when none of the preferred ones is available. */
const fallbackLanguage: UiLanguage = 'en';

/**
 * The UI language for the system's preferred languages (`navigator.languages` in the shell): the
 * first one the UI is written in, matched by language, so `de-AT` gets German.
 */
export function uiLanguageOf(preferred: readonly string[]): UiLanguage {
  return preferred.map(primaryLanguage).find(isUiLanguage) ?? fallbackLanguage;
}

function primaryLanguage(tag: string): string {
  return tag.split('-')[0]?.toLowerCase() ?? '';
}

function isUiLanguage(language: string): language is UiLanguage {
  return uiLanguages.some((known) => known === language);
}

/** The UI language for the setting: the chosen one, or the system's (see {@link uiLanguageOf}). */
export function uiLanguageFor(setting: LanguageSetting, preferred: readonly string[]): UiLanguage {
  return setting === 'system' ? uiLanguageOf(preferred) : setting;
}
