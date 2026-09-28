<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { toApp } from '@/router';

defineProps<{
  /** Every app Mouseless teaches. */
  apps: readonly AppDefinition[];
}>();
</script>

<template>
  <PageLayout>
    <ul>
      <li v-for="app in apps" :key="app.id">
        <RouterLink :to="toApp(app.id)">{{ app.title }}</RouterLink>
      </li>
    </ul>
  </PageLayout>
</template>
