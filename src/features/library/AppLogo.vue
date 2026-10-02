<script setup lang="ts">
import { logoOf } from './logos';

const { size = 14 } = defineProps<{
  /** The app whose logo is shown. */
  appId: string;
  /** Its width and height in pixels. */
  size?: number;
}>();
</script>

<template>
  <!-- Decoration: the app's name always stands next to it. -->
  <img class="logo" :src="logoOf(appId)" :width="size" :height="size" alt="" />
</template>

<style scoped>
.logo {
  flex: none;
  object-fit: contain;
}
</style>
