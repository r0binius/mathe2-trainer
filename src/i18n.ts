import type { Plugin } from 'vue';
import { computed, watchEffect } from 'vue';
import { createI18n, useI18n } from 'vue-i18n';

import type { UiLanguage } from '@/domain/settings/language';
import type { AppDefinition, Catalog, MessageKey } from '@/domain/shortcuts/types';

import { apps } from './data/apps';
import de from './locales/de.json';
import en from './locales/en.json';

/** The shape of the UI text, taken from the English messages. */
export type UiMessages = typeof en;

/** The dotted paths to the texts of a message tree, such as `library.recent`. */
type TextPaths<T> = {
  readonly [K in keyof T & string]: T[K] extends string ? K : `${K}.${TextPaths<T[K]>}`;
}[keyof T & string];

/** A text of the UI. A misspelled key is a type error, which vue-i18n's own `t` doesn't catch. */
export type UiKey = TextPaths<UiMessages>;

/** Translates texts in the current language, and follows it when it changes. */
export type Text = {
  /** A UI text, with its `{placeholders}` filled in from `values`. */
  readonly ui: (key: UiKey, values?: Readonly<Record<string, string | number>>) => string;
  /** A UI text in the plural form for `count`, which also fills its `{n}`. */
  readonly count: (key: UiKey, count: number) => string;
  /** A text of an app's shortcut data, such as a set's title. */
  readonly app: (appId: string, key: MessageKey) => string;
  /** An app's name in the current language: its `appTitle` where the vendor translates it. */
  readonly appTitle: (app: AppDefinition) => string;
  /** When something is, in days from today: "today", "tomorrow", "in 3 days". */
  readonly inDays: (days: number) => string;
  /** A share from 0 to 1 as a whole percentage, as the language writes it: "86 %" or "86%". */
  readonly percent: (share: number) => string;
};

/** Sets up the translations of the UI and of the shortcut data, in the given language. */
export function createAppI18n(language: UiLanguage): Plugin {
  return createI18n({
    legacy: false,
    locale: language,
    // Every text exists in both languages, so a fallback only shows a mistake, with a warning.
    fallbackLocale: 'en',
    // `satisfies` keeps the German UI text complete: a key missing from it is a type error.
    messages: {
      en: { ...en, apps: Object.fromEntries(apps.map(englishCatalogOf)) },
      de: { ...(de satisfies UiMessages), apps: Object.fromEntries(apps.map(germanCatalogOf)) },
    },
  });
}

// Every app's catalog also names Your commands, so its set reads like the app's own.
function germanCatalogOf(app: AppDefinition): readonly [string, Catalog] {
  return [app.id, { ...app.catalogs.de, yourCommands: { title: de.app.yourCommands } }];
}

function englishCatalogOf(app: AppDefinition): readonly [string, Catalog] {
  return [app.id, { ...app.catalogs.en, yourCommands: { title: en.app.yourCommands } }];
}

/** The translations of a component's texts. Components use it instead of vue-i18n's `t`. */
export function useText(): Text {
  const composer = useI18n();
  const { t, locale } = composer;

  function ui(key: UiKey, values: Readonly<Record<string, string | number>> = {}): string {
    return t(key, values);
  }

  function count(key: UiKey, n: number): string {
    return t(key, n);
  }

  function app(appId: string, key: MessageKey): string {
    return t(`apps.${appId}.${key}`);
  }

  // Made once per language rather than for every date shown.
  const relativeTime = computed(
    () => new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }),
  );

  const percentFormat = computed(
    () => new Intl.NumberFormat(locale.value, { style: 'percent', maximumFractionDigits: 0 }),
  );

  function appTitle({ id, title }: AppDefinition): string {
    const key = `apps.${id}.appTitle`;

    return composer.te(key) ? t(key) : title;
  }

  function inDays(days: number): string {
    return relativeTime.value.format(days, 'day');
  }

  function percent(share: number): string {
    return percentFormat.value.format(share);
  }

  return { ui, count, app, appTitle, inDays, percent };
}

/**
 * Keeps the UI in the given language while the calling component lives, switching as soon as it
 * changes; `undefined` keeps the current one. Also sets the document's language, which macOS
 * uses for text services such as hyphenation and VoiceOver.
 */
export function useUiLanguage(language: () => UiLanguage | undefined): void {
  const { locale } = useI18n();

  watchEffect(() => {
    const current = language();

    if (current !== undefined) {
      locale.value = current;
      document.documentElement.setAttribute('lang', current);
    }
  });
}
