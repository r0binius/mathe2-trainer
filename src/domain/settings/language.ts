/** The languages the UI is written in. */
export const uiLanguages = ['en', 'de'] as const;

/** One of the {@link uiLanguages}. */
export type UiLanguage = (typeof uiLanguages)[number];

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
