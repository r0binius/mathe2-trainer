<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

import BaseButton from './BaseButton.vue';

defineProps<{
  /** The page it goes back to. */
  to: RouteLocationRaw;
  /** Where it goes, for VoiceOver and as its tooltip. */
  label: string;
}>();
</script>

<template>
  <!-- A button in the title bar, not a link: it looks and focuses like the bar's other buttons. -->
  <RouterLink v-slot="{ navigate }" :to="to" custom>
    <BaseButton variant="toolbar" icon="chevronLeft" :label="label" @click="navigate" />
  </RouterLink>
</template>
