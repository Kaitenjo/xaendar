import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/test.ts'),
      fileName: () => `test.es.js`,
      formats: ['es']
    },
    minify: false,
    sourcemap: true,
    outDir: path.resolve(__dirname, 'dist'),
  }
})