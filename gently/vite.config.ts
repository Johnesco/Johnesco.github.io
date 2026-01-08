import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'playground',
  // Use './' for relative paths (works everywhere)
  // Override with BASE_URL env var for specific deployments
  base: process.env.BASE_URL || './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
