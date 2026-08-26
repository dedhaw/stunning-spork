import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/',
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
