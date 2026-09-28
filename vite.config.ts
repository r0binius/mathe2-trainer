import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
