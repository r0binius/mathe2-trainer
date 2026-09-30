<script setup lang="ts">
defineProps<{
  /** What the row sets, in the label column. */
  label: string;
  /** The ID of the one control the label names, so clicking the label focuses it. */
  labelFor?: string;
  /** Why the row's controls behave as they do, shown as its tooltip. */
  hint?: string;
}>();
</script>

<template>
  <div class="row" :title="hint">
    <label v-if="labelFor" class="label" :for="labelFor">{{ label }}</label>
    <span v-else class="label">{{ label }}</span>
    <slot />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.label {
  flex: none;
  width: 120px;
  color: var(--color-text-muted);
  font-weight: 600;
}
</style>
