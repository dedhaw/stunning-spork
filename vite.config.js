import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/',
  server: {
    proxy: {
      '/v1': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: 'web',
    emptyOutDir: false,
    rollupOptions: {
      output: { entryFileNames: 'app.js', assetFileNames: 'assets/[name][extname]' },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
});
