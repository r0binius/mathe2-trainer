<script setup lang="ts">
defineProps<{
  /** What the row sets, on its leading side. */
  label: string;
  /** The ID of the one control the label names, so clicking the label focuses it. */
  labelFor?: string;
  /** A line below the label on why the control behaves as it does. */
  hint?: string;
}>();

defineSlots<{
  /** The row's control, on its trailing side. */
  default: () => unknown;
}>();
</script>

<template>
  <!-- A row of a grouped form, as in System Settings: the label leading, the control trailing. -->
  <div class="row">
    <div class="text">
      <label v-if="labelFor" :for="labelFor">{{ label }}</label>
      <span v-else>{{ label }}</span>
      <p v-if="hint" class="hint">{{ hint }}</p>
    </div>
    <div class="control"><slot /></div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 44px;
  padding: 8px 12px;
}

.text {
  min-width: 0;
}

.hint {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: 11px;
}

.control {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
}
</style>
