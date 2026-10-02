<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onScopeDispose, useTemplateRef, watch } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import type { Keymap } from '@/domain/keyboard/keymap';
import type { LookupGroup } from '@/domain/lookup/rows';
import { builtInGroups, menuGroups } from '@/domain/lookup/rows';
import { uiLanguageFor } from '@/domain/settings/language';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText, useUiLanguage } from '@/i18n';
import {
  consoleLogger,
  loggerKey,
  lookupKey,
  missingLookup,
  missingWindows,
  windowsKey,
} from '@/ports';
import { useKeymapStore } from '@/stores/keymap';
import { useSettingsStore } from '@/stores/settings';

import ShortcutList from './ShortcutList.vue';
import { useLookup } from './useLookup';

const props = defineProps<{
  /** The apps with built-in sets, which the popover shows instead of their menus. */
  apps: readonly AppDefinition[];
}>();

const text = useText();
const windows = inject(windowsKey, missingWindows);
const logger = inject(loggerKey, consoleLogger);
const settings = useSettingsStore();
const keymap = useKeymapStore();
const [lookup, dispatch] = useLookup(props.apps, inject(lookupKey, missingLookup), logger);
const list = useTemplateRef<InstanceType<typeof ShortcutList>>('list');

useUiLanguage(() =>
  settings.settings.status === 'loaded'
    ? uiLanguageFor(settings.settings.value.language, navigator.languages)
    : undefined,
);

onMounted(() => {
  void settings.load();
  void keymap.load();
});

/** The layout's keymap. Without one, keys show as their definitions name them. */
const currentKeymap = computed<Keymap>(() =>
  keymap.layout.status === 'loaded' ? keymap.layout.value.keymap : {},
);

/** The name of the app the popover opened over, as the system or the app's catalog says it. */
const appName = computed(() => {
  const { screen } = lookup.value;

  switch (screen.kind) {
    case 'waiting':
    case 'noApp':
      return undefined;
    case 'builtIn':
      return text.appTitle(screen.app);
    case 'needsAccess':
    case 'loading':
    case 'loaded':
    case 'failed':
      return screen.app.name;
  }
});

/** The shortcuts to list, once there are any. */
const groups = computed<readonly LookupGroup[] | undefined>(() => {
  const { screen } = lookup.value;

  switch (screen.kind) {
    case 'builtIn':
      return builtInGroups(screen.app, currentKeymap.value, (key) => text.app(screen.app.id, key));
    case 'loaded':
      return menuGroups(screen.groups, currentKeymap.value);
    case 'waiting':
    case 'noApp':
    case 'needsAccess':
    case 'loading':
    case 'failed':
      return undefined;
  }
});

const query = computed({
  get: () => lookup.value.query,
  set: (typed: string) => {
    dispatch({ type: 'searched', query: typed });
  },
});

// Every opening starts with the cursor in the search field.
watch(
  () => lookup.value.openings,
  async () => {
    await nextTick();
    list.value?.focus();
  },
);

// Escape closes the popover, like a menu.
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    void dismiss();
  }
}

async function dismiss(): Promise<void> {
  const dismissed = await windows.dismissPopover();

  if (dismissed.kind === 'err') {
    logger.error(`Could not close the popover: ${dismissed.error.message}`);
  }
}

window.addEventListener('keydown', onKeyDown);

onScopeDispose(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <main class="popover">
    <p v-if="lookup.screen.kind === 'noApp'" class="hint">{{ text.ui('popover.noApp') }}</p>
    <template v-else-if="appName !== undefined">
      <h1 class="app truncate">{{ appName }}</h1>
      <ShortcutList
        v-if="groups !== undefined"
        ref="list"
        v-model:query="query"
        :groups="groups"
        :empty="text.ui('popover.noShortcuts', { app: appName })"
      />
      <div v-else-if="lookup.screen.kind === 'needsAccess'" class="hint">
        <p>{{ text.ui('popover.accessHint', { app: appName }) }}</p>
        <BaseButton variant="accent" @click="dispatch({ type: 'accessAsked' })">
          {{ text.ui('popover.openSettings') }}
        </BaseButton>
      </div>
      <p v-else-if="lookup.screen.kind === 'failed'" class="hint">
        {{ text.ui('popover.failed', { app: appName }) }}
      </p>
      <p v-else class="hint">{{ text.ui('popover.loading', { app: appName }) }}</p>
    </template>
  </main>
</template>

<style scoped>
/* An opaque panel with a hairline and small corners, the same spacing on every side. */
.popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100vh;
  padding: 10px 10px 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-box);
  color: var(--color-text);
}

/* Not shrunk by a long list: with its overflow hidden, it could shrink to nothing. */
.app {
  flex: none;
  padding: 0 2px;
  font-size: 14px;
  font-weight: 600;
}

.hint {
  display: grid;
  flex: 1 1 auto;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 24px;
  color: var(--color-text-secondary);
  text-align: center;
}
</style>
