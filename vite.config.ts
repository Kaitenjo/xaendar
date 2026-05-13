import path from 'path';
import { defineConfig } from 'vite';

console.log(path.resolve(__dirname, 'packages/signals/src'));

export default defineConfig({
  root: 'src',
  server: {
    open: true,
    port: 4200
  },
  resolve: {
    alias: {
      '@xaendar/common': path.resolve(__dirname, 'packages/common/src/public-api.ts'),
      '@xaendar/signals': path.resolve(__dirname, 'packages/signals/src/public-api.ts'),
      '@xaendar/types': path.resolve(__dirname, 'packages/types/src/public-api.ts'),
    }
  },
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/test.ts'),
      fileName: () => `test.es.js`,
      formats: ['es']
    },
    sourcemap: true,
    outDir: path.resolve(__dirname, 'dist/src'),
    emptyOutDir: true
  }
});