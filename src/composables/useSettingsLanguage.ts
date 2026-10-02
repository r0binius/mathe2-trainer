import { uiLanguageFor } from '@/domain/settings/language';
import { useUiLanguage } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';

/**
 * Keeps the calling window's UI in the language the settings choose, or the system's where they
 * leave it to the system, switching when they change. Until they're loaded, the current one stays.
 */
export function useSettingsLanguage(): void {
  const settings = useSettingsStore();

  useUiLanguage(() =>
    settings.settings.status === 'loaded'
      ? uiLanguageFor(settings.settings.value.language, navigator.languages)
      : undefined,
  );
}
