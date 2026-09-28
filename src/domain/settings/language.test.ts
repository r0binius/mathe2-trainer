import { describe, expect, it } from 'vitest';

import { uiLanguageOf } from './language';

describe('uiLanguageOf', () => {
  it('takes the first preferred language the UI is written in', () => {
    expect(uiLanguageOf(['fr-FR', 'de-DE', 'en-US'])).toBe('de');
  });

  it('matches regional variants by their language', () => {
    expect(uiLanguageOf(['de-AT'])).toBe('de');
    expect(uiLanguageOf(['en-GB'])).toBe('en');
  });

  it('ignores case, as language tags are case-insensitive', () => {
    expect(uiLanguageOf(['DE-ch'])).toBe('de');
  });

  it('falls back to English when no preferred language is available', () => {
    expect(uiLanguageOf(['fr-FR', 'ja'])).toBe('en');
    expect(uiLanguageOf([])).toBe('en');
  });
});
