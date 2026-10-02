<script setup lang="ts">
defineProps<{
  /** Where the page is, shown in the toolbar. */
  title?: string;
  /** A second level of where the page is, shown after the title. */
  subtitle?: string;
}>();

defineSlots<{
  /** The toolbar's leading side, before the title, such as a back button. */
  start?: () => unknown;
  /** The toolbar's trailing side, such as the page's actions. */
  end?: () => unknown;
  /** The page's content, which scrolls below the toolbar. */
  default: () => unknown;
}>();
</script>

<template>
  <div class="page">
    <!-- Dragging the toolbar moves the window, as the native one would. -->
    <header class="toolbar" data-tauri-drag-region>
      <slot name="start" />
      <div class="title truncate" data-tauri-drag-region>
        <template v-if="title !== undefined">{{ title }}</template>
        <span v-if="subtitle !== undefined" class="subtitle"> — {{ subtitle }}</span>
      </div>
      <slot name="end" />
    </header>

    <main class="content"><slot /></main>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-content);
}

/* The window's toolbar, as on macOS 27: capsules centred on the window's buttons, the title next
to them, and no line below. */
.toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  height: var(--toolbar-height);
  padding: 0 8px 0 12px;
}

.title {
  flex: 1 1 auto;
  font-size: 15px;
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.content {
  flex: 1 1 auto;
  padding: 0 20px 20px;
  overflow: hidden auto;
  overscroll-behavior: contain;
}
</style>
