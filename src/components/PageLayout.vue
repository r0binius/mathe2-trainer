<script setup lang="ts">
defineProps<{
  /** Where the page is, shown in the middle of the title bar. */
  title?: string;
  /** A second level of where the page is, shown after the title. */
  subtitle?: string;
}>();

defineSlots<{
  /** The title bar's left side, next to the window's buttons, such as a back button. */
  start?: () => unknown;
  /** The page's content, which scrolls below the title bar. */
  default: () => unknown;
}>();
</script>

<template>
  <div class="page">
    <!-- Dragging the title bar moves the window, as the native one would. -->
    <header class="bar" data-tauri-drag-region>
      <div class="start"><slot name="start" /></div>
      <div class="title truncate" data-tauri-drag-region>
        <template v-if="title !== undefined">{{ title }}</template>
        <template v-if="subtitle !== undefined">
          <span class="separator">&thinsp;/&thinsp;</span>{{ subtitle }}
        </template>
      </div>
      <div class="end" />
    </header>

    <main class="content"><slot /></main>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-black);
}

/* Floats over the content, which scrolls away beneath it, blurred. */
.bar {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  height: 38px;
  padding: 6px;
  background-color: color-mix(in srgb, var(--color-black) 50%, transparent);
  backdrop-filter: blur(20px);
}

/* Leaves room for the window's close, minimize and zoom buttons. */
.start {
  display: flex;
  padding-left: 72px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  opacity: 0.5;
}

.separator {
  opacity: 0.5;
}

.content {
  flex: 1 1 auto;
  padding: 38px 32px 32px;
  overflow: hidden auto;
  overscroll-behavior: contain;

  /* Starts the scrollbar below the title bar. */
  &::-webkit-scrollbar-button:vertical:start {
    display: block;
    height: 18px;
  }
}
</style>
