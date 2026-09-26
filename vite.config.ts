import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// Set by `tauri dev` when developing on a physical device.
const devHost = process.env['TAURI_DEV_HOST'];

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
    host: devHost ?? false,
    hmr: devHost === undefined ? true : { protocol: 'ws', host: devHost, port: 1421 },
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
