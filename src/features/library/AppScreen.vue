<script setup lang="ts">
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import PageLayout from '@/components/PageLayout.vue';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toLibrary, toSet } from '@/router';

defineProps<{
  /** The app whose sets are shown. */
  app: AppDefinition;
}>();

const router = useRouter();
const text = useText();
</script>

<template>
  <PageLayout :title="app.title">
    <template #start>
      <BaseButton icon="arrowLeft" @click="router.push(toLibrary())">
        {{ text.ui('app.back') }}
      </BaseButton>
    </template>

    <ul>
      <li v-for="set in app.sets" :key="set.id">
        <RouterLink :to="toSet(app.id, set.id)">{{ text.app(app.id, set.title) }}</RouterLink>
      </li>
    </ul>
  </PageLayout>
</template>
