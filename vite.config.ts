import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The build is one self-contained HTML file: it can be opened from disk, hosted anywhere, or
  // published as a Claude artifact.
  plugins: [vue(), viteSingleFile()],
  // MathJax reads its version from this constant; without it, it would look for a package.json
  // with Node's `require`, which a browser doesn't have.
  define: {
    PACKAGE_VERSION: JSON.stringify('3.2.1'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
