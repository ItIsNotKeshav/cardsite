import { defineConfig } from 'astro/config';

// Static output: every page is plain HTML, and only the scripts the page imports ship to the browser.
export default defineConfig({
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: {
      // Three.js is split into its own chunk and loaded after first paint.
      chunkSizeWarningLimit: 900,
    },
  },
});
