import { defineConfig } from 'vite';

// Relative base so the static build can be hosted from any path (GitHub Pages, Vercel, a USB stick).
export default defineConfig({
  base: './',
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 900 }, // three.js dominates the bundle
});
