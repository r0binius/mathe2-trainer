import { uiLanguageFor } from '@/domain/settings/language';
import { useUiLanguage } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';

/**
 * Keeps the calling window's UI in the language the settings choose, or the system's where they
 * leave it to the system, switching when they change. Until they're loaded, the current one stays.
 */
export function useSettingsLanguage(): void {
  const settings = useSettingsStore();

  useUiLanguage(() => {
    const language = settings.current?.language;

    return language === undefined ? undefined : uiLanguageFor(language, navigator.languages);
  });
}
