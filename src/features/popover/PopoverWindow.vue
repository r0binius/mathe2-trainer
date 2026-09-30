<script setup lang="ts">
import { useText } from '@/i18n';

const text = useText();
</script>

<template>
  <!-- A placeholder until the lookup (step 8) shows the shortcuts of the app in front. -->
  <main class="popover">
    <p>{{ text.ui('popover.placeholder') }}</p>
  </main>
</template>

<style scoped>
.popover {
  display: grid;
  place-items: center;
  height: 100vh;
  padding: 24px;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
