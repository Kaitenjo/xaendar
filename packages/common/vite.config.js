import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: 'XendarComponents',
      fileName: format => `xendar-components.${format}.js`
    },
    outDir: path.resolve(__dirname, '../../dist'),
    rollupOptions: {
      output: {
        dir: path.resolve(__dirname, '../../dist')
      }
    }
  },
  esbuild: {
    target: 'es2024'
  }
});
