import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],

  // vue-i18n's feature flags. Only the Composition API is used, without the global `<i18n-t>` and
  // `v-t`, so the rest is left out of the bundle, and declaring them silences its warning.
  define: {
    __VUE_I18N_FULL_INSTALL__: false,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // One page per window: the main window and the popover.
  build: {
    rolldownOptions: {
      input: ['index.html', 'popover.html'],
    },
  },

  // Keep Rust compiler errors visible in the terminal.
  clearScreen: false,

  server: {
    // Tauri expects the dev server on a fixed port.
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  test: {
    include: ['src/**/*.test.ts'],
  },
});
