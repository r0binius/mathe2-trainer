<script setup lang="ts">
defineSlots<{
  /** The title bar's leading side, such as a back button. */
  start?: () => unknown;
  /** The title bar's trailing side, such as the page's actions. */
  end?: () => unknown;
  /** The page's content, with its heading, which scrolls below the title bar. */
  default: () => unknown;
}>();
</script>

<template>
  <div class="page">
    <!-- A quiet title bar: only the page's buttons; dragging it moves the window. -->
    <header class="toolbar" data-tauri-drag-region>
      <slot name="start" />
      <div class="space" data-tauri-drag-region />
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

/* The detail's part of the title bar: flat, in the window's color, with only the page's buttons
in it and a hairline below, continuing the sidebar's. The page names itself in its content. */
.toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: var(--titlebar-height);
  padding: 0 4px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-window);
}

.space {
  flex: 1 1 auto;
  align-self: stretch;
}

.content {
  flex: 1 1 auto;
  padding: 12px 14px 14px;
  overflow: hidden auto;
  overscroll-behavior: contain;
}
</style>
