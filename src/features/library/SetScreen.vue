<script setup lang="ts">
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import PageLayout from '@/components/PageLayout.vue';
import type { AppDefinition, ShortcutSet } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toApp } from '@/router';

defineProps<{
  /** The app the set belongs to. */
  app: AppDefinition;
  /** The set whose shortcuts are shown. */
  set: ShortcutSet;
}>();

const router = useRouter();
const text = useText();
</script>

<template>
  <PageLayout :title="app.title" :subtitle="text.app(app.id, set.title)">
    <template #start>
      <BaseButton icon="arrowLeft" @click="router.push(toApp(app.id))">
        {{ text.ui('set.back') }}
      </BaseButton>
    </template>

    <ul>
      <li v-for="shortcut in set.shortcuts" :key="shortcut.title">
        {{ text.app(app.id, shortcut.title) }}
      </li>
    </ul>
  </PageLayout>
</template>
